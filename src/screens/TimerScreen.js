import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { getItem } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HistoryModal from "../screens/HistoryModal";
import Header from "../components/Header"; 
import EditTimerModal from "../screens/EditTimerModal";
import { Animated, Easing } from 'react-native'

const CIRCLE_SIZE = 280
const LINE_LENGTH = CIRCLE_SIZE / 2 - 12

export default function TimerScreen() {
  const [focusHours, setFocusHours] = useState('0');
  const [focusMinutes, setFocusMinutes] = useState('25');
  const [restMinutes, setRestMinutes] = useState('5');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [session, setSession] = useState('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current

  const [focusSeconds, setFocusSeconds] = useState("0");
  const [restHours, setRestHours] = useState("0");
  const [restSeconds, setRestSeconds] = useState("0");

  const intervalRef = useRef(null);
  const flatListRef = useRef(null);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Runs when this screen comes into focus (user navigates back to it)
  useFocusEffect(
    useCallback(() => {
      const fetchFolders = async () => {
        const storedFolders = await getItem("folders");
        if (storedFolders) setFolders(storedFolders);
        else setFolders([]);
      };

      fetchFolders();

      const f = folders.filter((item) => item.name == selectedFolder);

      if (f == null || f.length == 0) {
        setSelectedFolder("");
      }
    }, [])
  );

  // Saves a new Pomodoro session entry into AsyncStorage
  const saveHistory = async (entry) => {
    try {
      const existing = await AsyncStorage.getItem("pomodoroHistory");
      let logs = existing ? JSON.parse(existing) : [];

      logs.push(entry);

      await AsyncStorage.setItem("pomodoroHistory", JSON.stringify(logs));
    } catch (e) {
      console.log("Error saving history:", e);
    }
  };

  // Converts total seconds into HH:MM:SS format for display on the timer
  const formatTime = (secs) => {
    const hh = Math.floor(secs / 3600);
    const mm = Math.floor((secs % 3600) / 60);
    const ss = secs % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  // Calculates total focus session time in seconds (from hours + minutes)
  const getFocusSeconds = () =>
    parseInt(focusHours || 0) * 3600 + parseInt(focusMinutes || 0) * 60;

  // Calculates total rest session time in seconds
  const getRestSeconds = () => parseInt(restMinutes || 0) * 60;

  // Handles starting the timer
  const handleStart = async () => {
    if (!selectedFolder) {
      Alert.alert(
        'No Folder Selected',
        'You haven’t selected a folder. Do you want to proceed anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed Anyway',
            onPress: async () => {
              if (session === 'idle' || session === 'rest') {
                setSession('focus');
                setSecondsLeft(getFocusSeconds());
              } else {
                setSession('rest');
                setSecondsLeft(getRestSeconds());
              }
              setIsRunning(true);
              setIsPaused(false);
            },
          },
        ]
      );
      return;
    }

    if (session === 'idle' || session === 'rest') {
      setSession('focus');
      setSecondsLeft(getFocusSeconds());
    } else {
      setSession('rest');
      setSecondsLeft(getRestSeconds());
    }
    setIsRunning(true);
    setIsPaused(false);

    await AsyncStorage.setItem('activeFolder', selectedFolder.name);
  };

  // Pauses the timer
  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  // Resumes the timer from pause
  const handleResume = () => {
    if (session === 'idle') {
      handleStart();
      return;
    }
    setIsPaused(false);
    setIsRunning(true);
  };

  // Switches between focus and rest sessions
  const switchSession = (from) => {
    if (from === 'focus') {
      setSession('rest');
      setSecondsLeft(getRestSeconds());
    } else {
      setSession('focus');
      setSecondsLeft(getFocusSeconds());
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  // Skips the current session
  const handleSkip = () => {
    if (session === 'idle') {
      setSession('rest');
      setSecondsLeft(getRestSeconds());
      setIsRunning(true);
      setIsPaused(false);
      return;
    }
    switchSession(session);
  };

// Loads saved Pomodoro history when the screen first mounts
  useEffect(() => {
    const loadHistory = async () => {
      const existing = await AsyncStorage.getItem("pomodoroHistory");
      setLogs(existing ? JSON.parse(existing) : []);
    };

    loadHistory();
  }, []);

  // Loads total focused minutes for the current day
  useEffect(() => {
    const loadDailyTotal = async () => {
      const today = new Date().toISOString().split("T")[0];

      const totals = JSON.parse(await AsyncStorage.getItem("dailyTotals")) || {};
      setDailyTotal(totals[today] || 0);
    };

    loadDailyTotal();
  }, []);

  // Controls the timer interval when isRunning changes
  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Runs when time hits 0 and session is either focus or rest
  useEffect(() => {
    if (
      secondsLeft <= 0 &&
      (session === "focus" || session === "rest") &&
      (isRunning || isPaused)
    ) {
      setJustFinished(true);
      setIsRunning(false);

      setTimeout(async () => {
        setJustFinished(false);

        const entry = {
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString(),
          sessionType: session,
          folder: selectedFolder ? selectedFolder.name : "No folder",
          minutes:
            session === "focus"
              ? getFocusSeconds() / 60
              : getRestSeconds() / 60,
        };

        await saveHistory(entry);

        setLogs((prev) => [...prev, entry]);

        if (session === "focus") {
          const today = new Date().toISOString().split("T")[0];

          let totals = JSON.parse(await AsyncStorage.getItem("dailyTotals")) || {};

          let previous = totals[today] || 0;
          let updated = previous + entry.minutes;

          totals[today] = updated;

          await AsyncStorage.setItem("dailyTotals", JSON.stringify(totals));

        
          setDailyTotal(updated);
        }

        await AsyncStorage.removeItem("activeFolder");
        switchSession(session);

      }, 800);
    }
  }, [secondsLeft, session, isRunning, isPaused]);

  // Gets total seconds for the current session type
  const getTotalSeconds = () => {
    if (session === 'focus') {
      return (
        parseInt(focusHours || 0) * 3600 +
        parseInt(focusMinutes || 0) * 60 +
        parseInt(focusSeconds || 0)
      )
    }

    if (session === 'rest') {
      return (
        parseInt(restHours || 0) * 3600 +
        parseInt(restMinutes || 0) * 60 +
        parseInt(restSeconds || 0)
      )
    }

    return 1
  }

  // Updates animation progress ring for timer
  useEffect(() => {
    const total = getTotalSeconds()
    if (!total) return

    const progress = 1 - secondsLeft / total

    Animated.timing(rotation, {
      toValue: progress,
      duration: 250,
      useNativeDriver: true,
    }).start()

  }, [secondsLeft, session])

  // Warns user that changing folder will reset the timer
  const alertResetFolder = (newFolder) => {
    Alert.alert(
      'Reset Timer?',
      'Changing folders will reset your current timer. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setSelectedFolder(newFolder);
            setSession('idle');
            setIsRunning(false);
            setIsPaused(false);
            setSecondsLeft(0);
          },
        },
      ]
    );
  };

  // Displays goal progress bar
  const GoalProgressBar = ({ total, goal }) => {
    const percentage = Math.min((total / goal) * 100, 100);

    return (
      <View style={styles.goalContainer}>
        <Text style={styles.goalText}>
          {Math.round(total)} / {goal} min focus today
        </Text>

        <View style={styles.goalBar}>
          <View style={[styles.goalFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Timer" />

      <View
        style={[
          styles.outerContainer,
          session === 'focus' && styles.outerFocus,
          session === 'rest' && styles.outerRest,
          isPaused && styles.outerPaused,
        ]}
      >

        <View style={styles.frame}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.inner}>
              <GoalProgressBar total={dailyTotal} goal={80} />
                <View style={[styles.sectionFrame, styles.folderBox]}>
                  <Text style={styles.mainTitle}>Folder Selection</Text>

                  {folders.length > 0 ? (
                    <View style={styles.folderSelectorWrapper}>
                      {/* Left Arrow */}
                      <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={() => {
                          flatListRef.current?.scrollToOffset({
                            offset: Math.max(currentOffset - 120, 0),
                            animated: true,
                          });
                          setCurrentOffset(Math.max(currentOffset - 120, 0));
                        }}
                      >
                        <Feather name="chevron-left" size={20} color="#0b2b2f" />
                      </TouchableOpacity>

                      {/* Scrollable Folder List */}
                      <View style={styles.folderSelector}>
                        <FlatList
                          ref={flatListRef}
                          data={folders}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          keyExtractor={(item, index) => `${item.name}-${index}`}
                          onScroll={(e) =>
                            setCurrentOffset(e.nativeEvent.contentOffset.x)
                          }
                          scrollEventThrottle={16}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[
                                styles.folderButton,
                                selectedFolder?.name === item.name &&
                                  styles.folderButtonSelected,
                              ]}
                              onPress={() => {
                                if (isRunning || isPaused) {
                                  alertResetFolder(item);
                                } else {
                                  if (selectedFolder?.name === item.name) {
                                    setSelectedFolder(null); 
                                  } else {
                                    setSelectedFolder(item);
                                  }
                                }
                              }}
                            >
                              <Text
                                style={[
                                  styles.folderText,
                                  selectedFolder?.name === item.name &&
                                    styles.folderTextSelected,
                                ]}
                              >
                                {item.name}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>

                      {/* Right Arrow */}
                      <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={() => {
                          flatListRef.current?.scrollToOffset({
                            offset: currentOffset + 120,
                            animated: true,
                          });
                          setCurrentOffset(currentOffset + 120);
                        }}
                      >
                        <Feather name="chevron-right" size={20} color="#0b2b2f" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.emptyFolderText}>No folders yet</Text>
                  )}
                </View>

              {/* Timer Box */}
              <View style={styles.circleContainer}>

                <Animated.View
                  style={[
                    styles.spinnerWrapper,
                    {
                      transform: [{
                        rotate: rotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.spinnerLine} />
                </Animated.View>

                <View
                  style={[
                    styles.timerBox,
                    session === 'focus' && styles.shadowFocus,
                    session === 'rest' && styles.shadowRest,
                    session === 'idle' && styles.shadowIdle,
                    isPaused && styles.shadowPaused,
                  ]}
                >
                  <Text style={styles.sessionLabel}>
                    {session === 'idle'
                      ? 'Idle'
                      : session === 'focus'
                      ? 'Focus'
                      : 'Rest'}
                  </Text>

                  <Text style={styles.timeText}>
                    {formatTime(Math.max(0, secondsLeft))}
                  </Text>

                  <Text style={styles.folderTag}>
                    {selectedFolder ? selectedFolder.name : 'Select Folder'}
                  </Text>
                </View>

              </View>

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.editButton]}
                  onPress={() => setEditModalVisible(true)}
                >
                  <Feather name="edit-2" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    isRunning && !isPaused
                      ? styles.pauseButton
                      : styles.startButton
                  ]}
                  onPress={() => {
                    if (isRunning && !isPaused) {
                      handlePause();
                    } else if (isPaused) {
                      handleResume();
                    } else {
                      handleStart();
                    }
                  }}
                >
                  <Feather
                    name={isRunning && !isPaused ? "pause" : "play"}
                    size={28}
                    color="#fff"
                  />
                </TouchableOpacity>

                {/* SKIP BUTTON */}
                <TouchableOpacity
                  style={[styles.iconButton, styles.skipButton]}
                  onPress={handleSkip}
                >
                  <Feather name="skip-forward" size={28} color="#fff" />
                </TouchableOpacity>

              </View>
              {/* History Button */}
              <TouchableOpacity 
                onPress={() => setHistoryVisible(true)} 
                style={styles.historyButton}
              >
                <Text style={styles.historyButtonText}>View History</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>

      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        logs={logs}
      />

      <EditTimerModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={(focus, rest) => {
          // focus = {h, m, s}
          // rest = {h, m, s}

          setFocusHours(String(focus.h))
          setFocusMinutes(String(focus.m))
          setFocusSeconds(String(focus.s))

          setRestHours(String(rest.h))
          setRestMinutes(String(rest.m))
          setRestSeconds(String(rest.s))
        }}
        focusTime={{
          h: focusHours,
          m: focusMinutes,
          s: focusSeconds,
        }}
        restTime={{
          h: restHours,
          m: restMinutes,
          s: restSeconds,
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  // ---- Containers ----
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    backgroundColor: '#d2d2d2ff', 
  },
  outerFocus: {
    backgroundColor: '#dafcc4ff',
  },
  outerRest: {
    backgroundColor: '#d4f2fbff',
  },
  outerPaused: {
    backgroundColor: '#fbffafff',
  },
  frame: {
    flex: 1,
    width: '92%',
    margin: 15,
    borderRadius: 8,
    backgroundColor: '#f1f1f1ff',
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  inner: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },

  // ---- Title ----
  title: {
    fontSize: 45,
    fontWeight: '700',
    padding: 8,
    textAlign: 'center',
    marginBottom: 20,
    borderRadius: 12,
    color: '#000',
    backgroundColor: '#f0f0f0ff'
  },

  // ---- Folder Selector ----
  folderBox: {
    backgroundColor: '#e9e9e9ff',
    borderWeight:1,
    borderColor: '#9c9c9cff',
    marginBottom: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    paddingTop: 13,
  },

  folderSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginLeft: 30,
    marginRight: 15,
  },
  arrowButton: {
    paddingHorizontal: 1,
  },
  folderSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  folderButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: '#bbbbbbff',
    marginHorizontal: 4,
  },
  folderButtonSelected: {
    backgroundColor: '#000000ff',
  },
  folderText: {
    color: '#0b2b2f',
    fontWeight: '600',
  },
  folderTextSelected: {
    color: '#fff',
  },
  folderTag: {
    marginTop: 8,
    fontSize: 16,
    color: '#0b2b2f',
    fontStyle: 'italic',
  },

  // ---- Timer Box ----

  sessionLabel: {
    fontSize: 19,
    marginBottom: 2,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 40,
    fontWeight: '800',
  },
  shadowFocus: {
    shadowColor: '#8ecf63',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  shadowRest: {
    shadowColor: '#69b2cf',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  shadowIdle: {
    shadowColor: '#aaaaaa',
  },

  shadowPaused: {
    shadowColor: '#d8be54', 
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // ---- Buttons ----
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10, 
  },

  iconButton: {
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 50,
  },

  startButton: {
    backgroundColor: "#64b365ff",
  },

  editButton: {
    backgroundColor: '#aeadadff',
  },

  pauseButton: {
    backgroundColor: "#6caae7ff",
  },

  skipButton: {
    backgroundColor: "#555",
  },

  // ---- Focus/Rest Sections ----
  timeSetupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  sectionContainer: {
    flex: 0.5,
    alignItems: 'center',
  },
  sectionFrame: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: '#666',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeFocusBox: {
    backgroundColor: '#e2ffcd',
    borderColor: '#8ecf63',
    borderWidth: 1,
    borderColor: '#9fba8dff',
  },
  activeRestBox: {
    backgroundColor: '#e2f6fd',
    borderColor: '#69b2cf',
    borderWidth: 1,
    borderColor: '#9abcc9ff',
  },
  pausedBox: {
    opacity: 0.7,
  },

  // ---- Inputs ----
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b2b2f',
    marginBottom: 8,
  },
  subInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#102a43',
    textAlign: 'center',
  },
  inputGroupQuarter: {
    flex: 0.5,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  inputGroupHalf: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    fontSize: 16,
    textAlign: 'center',
  },
  
  historyButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#a0a0a0ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
    marginTop: 15,
  },

  historyButtonText: {
    color: '#0b2b2f',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },

  // ---- Goal Tracker ----

  goalContainer: {
    width: "100%",
    marginTop: -20,
    marginBottom: 20,
    alignItems: "center",
  },

  goalText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
    paddingTop: 12,
    color: "#0b2b2f",
  },

  goalBar: {
    width: "97%",
    height: 15,
    backgroundColor: "#ddd",
    borderRadius: 5,
    overflow: "hidden",
  },

  goalFill: {
    height: "100%",
    backgroundColor: "#69b2cf",
  },

  circleContainer: {
    width: CIRCLE_SIZE + 25,
    height: CIRCLE_SIZE +10,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  timerBox: {
    width: CIRCLE_SIZE - 30,
    height: CIRCLE_SIZE - 30,
    borderRadius: (CIRCLE_SIZE - 30) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  spinnerWrapper: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  spinnerLine: {
    position: 'absolute',
    width: 10,
    height: LINE_LENGTH + 20 ,
    backgroundColor: '#2c2121ff',
    borderRadius: 10,
    transform: [{ translateY: -LINE_LENGTH / 2 }],
  },

});
