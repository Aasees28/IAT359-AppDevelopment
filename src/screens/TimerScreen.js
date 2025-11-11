import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import Header from '../components/Header';
import { getItem } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const intervalRef = useRef(null);
  const flatListRef = useRef(null);
  const [currentOffset, setCurrentOffset] = useState(0);

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

  const formatTime = (secs) => {
    const hh = Math.floor(secs / 3600);
    const mm = Math.floor((secs % 3600) / 60);
    const ss = secs % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  const getBackgroundColor = () => {
    if (justFinished) return styles.bgFinished.backgroundColor;
    if (session === 'idle') return styles.bgIdle.backgroundColor;
    if (isPaused) return styles.bgPaused.backgroundColor;
    if (session === 'focus') return styles.bgFocus.backgroundColor;
    if (session === 'rest') return styles.bgRest.backgroundColor;
    return styles.bgIdle.backgroundColor;
  };

  const getFocusSeconds = () =>
    parseInt(focusHours || 0) * 3600 + parseInt(focusMinutes || 0) * 60;
  const getRestSeconds = () => parseInt(restMinutes || 0) * 60;

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

  // Normal start flow if folder is selected
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



  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleResume = () => {
    if (session === 'idle') {
      handleStart();
      return;
    }
    setIsPaused(false);
    setIsRunning(true);
  };

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

  useEffect(() => {
    if (
      secondsLeft <= 0 &&
      (session === 'focus' || session === 'rest') &&
      (isRunning || isPaused)
    ) {
      setJustFinished(true);
      setIsRunning(false);
      setTimeout(async () => {
        setJustFinished(false);
        await AsyncStorage.removeItem('activeFolder');
        switchSession(session);
      }, 800);
    }
  }, [secondsLeft, session, isRunning, isPaused]);

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

return (
  <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Timer</Text>

              <View style={[styles.sectionFrame, styles.folderBox]}>
                <Text style={styles.mainTitle}>Folders</Text>

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
                                  setSelectedFolder(null); // Deselect if clicked again
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


            {/* Buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleStart}
              >
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  isPaused ? styles.resumeButton : styles.pauseButton,
                ]}
                onPress={() => {
                  if (isPaused) {
                    handleResume();
                  } else {
                    handlePause();
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
              >
                <Text style={styles.buttonText}>Skip</Text>
              </TouchableOpacity>
            </View>


            {/* Time Inputs */}
            <View style={styles.timeSetupContainer}>
              {/* Focus Section */}
              <View
                style={[
                  styles.sectionContainer,
                  styles.sectionFrame,
                  session === 'focus' && styles.activeFocusBox,
                  isPaused && styles.pausedBox,
                ]}
              >
                <Text style={styles.mainTitle}>Focus</Text>
                <View style={styles.subInputsRow}>
                  <View style={styles.inputGroupQuarter}>
                    <Text style={styles.subLabel}>Hours</Text>
                    <TextInput
                      style={styles.input}
                      value={focusHours}
                      onChangeText={(t) => setFocusHours(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>

                  <View style={styles.inputGroupQuarter}>
                    <Text style={styles.subLabel}>Minutes</Text>
                    <TextInput
                      style={styles.input}
                      value={focusMinutes}
                      onChangeText={(t) => setFocusMinutes(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder="25"
                    />
                  </View>
                </View>
              </View>

              {/* Rest Section */}
              <View
                style={[
                  styles.sectionContainer,
                  styles.sectionFrame,
                  session === 'rest' && styles.activeRestBox,
                  isPaused && styles.pausedBox,

                ]}
              >
                <Text style={styles.mainTitle}>Rest</Text>
                <View style={styles.subInputsRow}>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.subLabel}>Minutes</Text>
                    <TextInput
                      style={styles.input}
                      value={restMinutes}
                      onChangeText={(t) => setRestMinutes(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder="5"
                    />
                  </View>
                </View>
              </View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ---- Containers ----
  container: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: '#666',
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 80,
    justifyContent: 'space-between',
    
  },

  // ---- Title ----
  title: {
    fontSize: 45,
    fontWeight: '700',
    borderWidth: 1,
    padding: 10,
    textAlign: 'center',
    marginBottom: 20,
    borderRadius: 12,
    color: '#000',
    backgroundColor: '#fff'
  },

  // ---- Folder Selector ----
  folderBox: {
    backgroundColor: '#fff',
    marginBottom: 10,
    marginTop: 6,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
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
    borderColor: '#000',
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
    fontSize: 14,
    color: '#0b2b2f',
    fontStyle: 'italic',
  },

  // ---- Timer Box ----
  timerBox: {
    alignItems: 'center',
    marginVertical: 10,
    padding: 18,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: 1,
    borderColor: '#666',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sessionLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '800',
  },

    shadowFocus: {
    shadowColor: '#8ecf63', // green glow
    shadowOpacity: 0.4,
    shadowRadius: 10,

  },

  shadowRest: {
    shadowColor: '#69b2cf', // blue glow
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  shadowIdle: {
    shadowColor: '#aaaaaa', // neutral gray
  },

  shadowPaused: {
    shadowColor: '#d8be54', // gold/yellow glow
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // ---- Buttons ----
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    padding: 9,
    marginHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  startButton: { backgroundColor: '#27a327a1' },
  pauseButton: { backgroundColor: '#d8be54ff' },
  resumeButton: { backgroundColor: '#d952c0ff' },
  skipButton: { backgroundColor: '#5c96bcff' },
  buttonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },

  // ---- Focus/Rest Sections ----
  timeSetupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionContainer: {
    flex: 0.5,
    alignItems: 'center',
  },
  sectionFrame: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
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
  },
  activeRestBox: {
    backgroundColor: '#e2f6fd',
    borderColor: '#69b2cf',
  },
  pausedBox: {
    opacity: 0.7,
  },

  // ---- Inputs ----
  mainTitle: {
    fontSize: 20,
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
});
