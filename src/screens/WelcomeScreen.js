import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList,  TouchableWithoutFeedback, ScrollView, Alert, Modal } from "react-native";
import { CalendarList } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import CheckBox from "react-native-check-box";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { storeItem, getItem, removeItem } from "../utils/storage";
import { signOut } from "firebase/auth";
import { auth, db } from "../Firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

const colors = ["#f04c41", "#f0bb41", "#aaf041", "#41d3f0", "#416cf0", "#9241f0", "#f041bb"]
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);
  const [today, setToday] = useState(`${year}-${month}-${day}`);
  const [dots, setDots] = useState({});
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [userName, setUserName] = useState("");
  const [holidays, setHolidays] = useState([]);

  const randomColor = () => {
    return colors[Math.floor(Math.random() * 7)];
  }

  const fetchCanadianHolidays = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const url = `https://canada-holidays.ca/api/v1/holidays?year=${currentYear}`;

    const response = await fetch(url);
    const json = await response.json();

    if (!json.holidays) {
      console.log("No holidays found");
      return;
    }

    const holidayDots = {};
      json.holidays.forEach((h) => {
        holidayDots[h.date] = {
          dots: [{ color: "red" }],
          marked: true,
          holidayName: h.nameEn
        };
      });

      setHolidays(json.holidays);
      setDots((prev) => ({ ...prev, ...holidayDots }));

      console.log("Fetched Holidays:", json.holidays);

    } catch (error) {
      console.error("Holiday API Error:", error);
    }
  };


  const onCheck = async (folderName, todoName) => {
    const updated = events.map((item) => {
      if (item.name === folderName) {
        return {
          ...item,
          todos: item.todos.map((todo) => {
            if (todo.name == todoName) {
              return {
                ...todo,
                checked: !(todo.checked)
              }
            } else {
              return todo;
            }
          })
        }
      } else {
        return item;
      }
    });

    setEvents(updated)

    // update filteredEvents
    filterEvents(updated);
    await storeItem("folders", updated);

  }

  const openHolidayModal = (date) => {
  const holidayName = holidays[date]?.name || "Holiday";
  setSelectedHoliday(holidayName);
  setHolidayModal(true);
};


  const onSelectDate = (date) => {
    const selected = date.dateString;

    setDots((prevDots) => {
      const newDots = { ...prevDots };

      if (selectedDate && newDots[selectedDate]) {
        newDots[selectedDate] = { ...newDots[selectedDate], selected: false };
      }

      if (today != selected) {
        newDots[selected] = { ...newDots[selected], selected: true };
      }
      setSelectedDate(selected);
      return newDots;
    });

    setExpanded(true);
  };

  const filterEvents = (e) => {
    const filtered = [];
    e.forEach((item) => {
      const todos = [];
      item.todos.forEach((todo) => {
        if (todo.date === selectedDate) {
          todos.push({name: todo.name, checked: todo.checked});
        }
      })
      filtered.push({name: item.name, todos: todos})
    })
    setFilteredEvents(filtered)
  }

  const formatDateForModal = (date) => {
    const d = date.split('-')
    const selected = new Date(d[0], d[1]-1, d[2]);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${days[selected.getDay()]} ${months[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
  }

  const nextDate = () => {
    const selected = new Date(selectedDate);
    selected.setDate(selected.getDate() + 1);

    setSelectedDate(selected.toISOString().split('T')[0]);
  }

  const prevDate = () => {
    const selected = new Date(selectedDate);
    selected.setDate(selected.getDate() - 1);

    setSelectedDate(selected.toISOString().split('T')[0]);
  }

  const signout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      await removeItem("userName");
      await removeItem("folders");
      navigation.replace("Signup");
    } catch (error) {
      console.log("Error signing out:", error.message);
    }
    setMenuVisible(false);
  }
  
useFocusEffect(
  useCallback(() => {
    (async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const { firstName } = userDoc.data();
            setUserName(firstName);
            await storeItem("userName", firstName);
          } else {
            console.log("No Firestore record found, using cached name");
            const cachedName = await getItem("userName");
            if (cachedName) setUserName(cachedName);
          }
        } catch (error) {
          console.log("Error fetching Firestore name:", error.message);
        }
      } else {
        console.log("No user logged in");
      }

      const res = await getItem("folders");
      console.log("res: ", res);

      let newDots = {};

      if (!res) {
        setEvents([]);
        setDots({});
      } else {
        setEvents(res);

        res.forEach((folder) => {
          const c = randomColor();
          folder.todos.forEach((todo) => {
            if (!newDots[todo.date]) {
              newDots[todo.date] = { dots: [] };
            }
            newDots[todo.date].dots.push({
              key: `${todo.name}-${folder.name}`,
              color: c,
            });
          });
        });

        filterEvents(res);
      }

      try {
        const year = new Date().getFullYear();
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/CA`
        );
        const holidayData = await response.json();

        setHolidays(holidayData);

        holidayData.forEach((h) => {
          const date = h.date;
          if (!newDots[date]) newDots[date] = { dots: [] };

          newDots[date].dots.push({
            key: `holiday-${h.name}`,
            color: "#ff4444",
          });
        });
      } catch (err) {
        console.log("Holiday API error:", err);
      }

      setDots(newDots);
    })();
  }, [])
);

  // Load everything on screen mount
  useEffect(() => {
    (async () => {
      await loadUserData();
      await fetchCanadianHolidays();
      filterEvents(events);
    })();
  }, []);

  // Re-filter whenever the user selects a new date
  useEffect(() => {
    filterEvents(events);
  }, [selectedDate]);

  const holidayList =
  holidays[selectedDate] && holidays[selectedDate].length > 0
    ? holidays[selectedDate]
    : [];


  return (
    <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome {userName ? userName : ""},</Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
              <Feather name="user" size={28} color="black" />
            </TouchableOpacity>

            {menuVisible && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                    onPress={signout}
                >
                  <Text style={styles.dropdownText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
      </View>

      <Modal
        transparent={true}
        visible={expanded}
        onRequestClose={() => {
            setExpanded(!expanded);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.todoContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Feather name="x" size={26} color="black" />
              </TouchableOpacity>
            </View>

              {holidayList.length > 0 && (
                <View style={styles.holidayContainer}>
                  {holidayList.map((h, idx) => (
                    <Text key={idx} style={styles.holidayText}>
                      🎉 {h.name}
                    </Text>
                  ))}
                </View>
              )}

            <View style={styles.todoHeader}>
              <TouchableOpacity onPress={prevDate}>
                <Feather name="chevron-left" size={26} color="black" />
              </TouchableOpacity>
              <Text style={styles.selectedDate}>{formatDateForModal(selectedDate)}</Text>
              <TouchableOpacity onPress={nextDate}>
                <Feather name="chevron-right" size={26} color="black" />
              </TouchableOpacity>
            </View>

              {/* HOLIDAY SECTION */}
              {(() => {
                const holiday = holidays.find(h => h.date === selectedDate);
                if (!holiday) return null;

                return (
                  <View style={styles.holidayContainer}>
                    <Text style={styles.holidayLabel}>Holiday</Text>
                    <Text style={styles.holidayName}>{holiday.name}</Text>
                  </View>
                );
              })()}

            {filteredEvents.map((item, i) => {
              return item.todos.length > 0 ? (
                <View key={i} style={styles.todoItemContainer}>
                  <View style={styles.todoItemHeader}>
                    <Text style={[styles.todoHeaderTitle, { backgroundColor: "#fff6c2"}]}>{item.name}</Text>
                  </View>
                  <View style={styles.todos}>
                    {item.todos.map((todo, i) => (
                      <View style={styles.todoItem} key={i}>
                        <CheckBox
                          isChecked={todo.checked}
                          onClick={() => onCheck(item.name, todo.name)}
                          checkedImage={<MaterialIcons name="check-box" size={28} color="black" />}
                          unCheckedImage={<MaterialIcons name="check-box-outline-blank" size={28} color="black" />}
                        />
                        <Text>{todo.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View key={i}></View>
              )
            })}
          </View>
        </View>
      </Modal>

      <View style={styles.body}>
        <CalendarList 
          theme={theme}
          horizontal
          staticHeader
          pagingEnabled
          pastScrollRange={12}
          futureScrollRange={12}
          markingType={'multi-dot'}
          markedDates={dots}
          onDayPress={onSelectDate}
          hideArrows
        />
      </View>
    </View>
  </TouchableWithoutFeedback>
);
}

const theme = {
  'stylesheet.calendar.header': {
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    monthText: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
    },
  },
  'stylesheet.day.basic': {
    today: {},  // keep this to overwrite the default styling
    todayText: {
      width: 25,
      height: 25,
      backgroundColor: '#000',
      borderRadius: 99,
      color: 'white',
      borderColor: 'black',
      borderWidth: 2,
      textAlign: 'center',
    },
    selected: {},  // keep this to overwrite the default styling
    selectedText: {
      width: 25,
      height: 25,
      borderWidth: 2,
      borderColor: '#000',
      backgroundColor: 'transparent', 
      borderRadius: 99,
      color: 'black',
      textAlign: 'center',
    },
    base: {
      weight: 50,
      height: 70,
      gap: 5,
    },
  },
  'stylesheet.calendar.main': {
    container: {
      paddingBottom: 0,
      marginBottom: 0,
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 70, // 🔹 add this line to push everything down
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuIcon: {
    width: 28,
    justifyContent: "space-between",
    height: 18,
  },
  bar: {
    width: "100%",
    height: 2,
    backgroundColor: "#444",
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 5
  },
  body: {
    flex: 1,
    paddingTop: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },  
  todoWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
    width: '90%',
    height: '70%'
  },
  todoContainer: {
    padding: 20,
    backgroundColor: 'white',
    gap: 10,
    borderRadius: 30, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
    width: '90%',
    height: '60%'
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: 'bold'
  },  
  todoItemContainer: {
    marginBottom: 10,
  },
  todoItemHeader: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  todoHeaderTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todos: {
    marginBottom: 5,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 2,
    backgroundColor: '#ffe7e7ff' ,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    width: 100,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: 'black',
    paddingVertical: 6,
    paddingHorizontal: 17,
    textAlign: 'left',
  },

  holidayContainer: {
    backgroundColor: "#fffbe6",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 10,
    width: "98%",
    borderColor: "#ffe7a3",
    borderWidth: 1,
  },

  holidayLabel: {
    fontSize: 10,
    color: "#b79b00",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },

  holidayName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#6b4e00",
  },

});
