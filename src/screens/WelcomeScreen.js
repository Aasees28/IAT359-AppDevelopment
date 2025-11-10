import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList,  TouchableWithoutFeedback, ScrollView, Alert } from "react-native";
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
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);
  const [today, setToday] = useState(`${year}-${month}-${day}`);
  const [dots, setDots] = useState({});
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [userName, setUserName] = useState("");

  const randomColor = () => {
    return colors[Math.floor(Math.random() * 7)];
  }

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
    console.log(updated)
    await storeItem("folders", updated);

  }

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

  useFocusEffect(
    useCallback(() => {
      (async () => {
        // Try Firestore first, then local storage as fallback
        const user = auth.currentUser;
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const { firstName } = userDoc.data();
              setUserName(firstName);
              await storeItem("userName", firstName); // keep synced locally
            } else {
              console.log("⚠️ No Firestore record found, using cached name");
              const cachedName = await getItem("userName");
              if (cachedName) setUserName(cachedName);
            }
          } catch (error) {
            console.log("❌ Error fetching Firestore name:", error.message);
          }
        } else {
          console.log("⚠️ No user logged in");
        }

        // for debugging; if no data, uncomment below to set up and check any checkbox to store in storage then comment
        // const res = [
        //   { 
        //     name: "CMPT403", 
        //     notes: [],
        //     todos: [
        //       { date: "2025-11-08", name: "Assignment 4", checked: false },
        //       { date: "2025-11-09", name: "Midterm", checked: false }
        //     ]
        //   },
        //   { 
        //     name: "CMPT454", 
        //     notes: [],
        //     todos: [
        //       { date: "2025-11-09", name: "Assignment 5", checked: false },
        //       { date: "2025-11-09", name: "Project A", checked: false }
        //     ]
        //   },
        // ]

        // get folders data to list out daily deadlines
        const res = await getItem("folders");
        console.log("res: ", res)

        if (!res) {
          setEvents([]);
          setDots({});
        } else {
          setEvents(res);

          // set up dots for calendar
          const newDots = {};
          res.forEach((folder) => {
            const c = randomColor();
            folder.todos.forEach((todo) => {
              if (!newDots[todo.date]) {
                newDots[todo.date] = { dots: [] };
              }
              newDots[todo.date].dots.push({ key: `${todo.name}-${folder.name}`, color: c });
            });
          });

          setDots(newDots);

          // update filteredEvents
          filterEvents(res);
        }
      })()
    }, [])
  )

  useEffect(() => {
    filterEvents(events);
  }, [selectedDate])

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
                    onPress={async () => {
                      try {
                        await signOut(auth);
                        console.log("✅ User signed out");
                        await removeItem("userName"); // 👈 clear old name
                        await removeItem("folders");  // optional — if you want per-user folders
                        navigation.replace("Signup"); // 👈 navigate back to signup/login
                      } catch (error) {
                        console.log("❌ Error signing out:", error.message);
                      }
                      setMenuVisible(false);
                    }}
                >
                  <Text style={styles.dropdownText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>


      </View>

      <ScrollView style={styles.body}>
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

        <View style={styles.todoContainer}>
          {filteredEvents.map((item, i) => {
            return item.todos.length > 0 ? (
              <View key={i} style={styles.todoItemContainer}>
                <View style={styles.todoItemHeader}>
                  <Text style={[styles.todoHeaderTitle, { backgroundColor: "#fff6c2"}]}>{item.name}</Text>
                  <Text>{item.todos.length}</Text>
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
      </ScrollView>
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
      height: 80,
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
    paddingTop: 30,
  },
  todoContainer: {
    padding: 20,
    gap: 10,
  },
  todoItemContainer: {
    marginBottom: 10,
  },
  todoItemHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  todoHeaderTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todos: {

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
}

});
