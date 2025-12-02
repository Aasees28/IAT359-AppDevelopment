import React, { useState } from 'react';
import { storeItem } from "../utils/storage";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig"; 

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,  Modal,  TouchableWithoutFeedback, Keyboard } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebaseConfig'; 

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 

  const [modalVisible, setModalVisible] = useState(false);
  const [firstName, setFirstName] = useState(""); 
  const [lastName, setLastName] = useState("");

  // Handles user login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const { firstName } = userDoc.data();
        await storeItem("userName", firstName);
      }

      console.log("Logged in & name loaded");
    } catch (error) {
      let message = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;
        case "auth/invalid-credential":
          message = "Incorrect email or password. Please try again.";
          break;
        case "auth/missing-password":
          message = "Type your Password.";
          break;
        default:
          message = error.message;
          break;
      }

      Alert.alert("Login Failed", message);
    }
  };

  // Handles user signup
  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Missing Fields", "Please fill all fields before signing up.");
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user info to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName,
        email: email,
        createdAt: new Date()
      });

      // Optionally also store locally (for offline use)
      await storeItem("userName", firstName);

      console.log("Account created & name stored in Firestore");
      setModalVisible(false);
      navigation.navigate("Home");
    } catch (error) {
      let message = "";
      switch (error.code) {
        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;
        case "auth/email-already-in-use":
          message = "This email is already registered. Try logging in instead.";
          break;
        case "auth/weak-password":
          message = "Password is too weak. Use at least 6 characters.";
          break;
        default:
          message = error.message;
          break;
      }
      Alert.alert("Sign Up Error", message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Log in</Text>

        <Text style={styles.subtitle}>
          or{' '}
          <Text style={styles.link} onPress={() => setModalVisible(true)}>
            sign up
          </Text>
        </Text>

        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          placeholder="enter email address..."
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="enter password..."
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.logInButton}
          onPress={handleLogin}>
          <Text style={styles.logInText}>Login</Text>
        </TouchableOpacity>


        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => setModalVisible(true)} 
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Signup modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Create Account</Text>

              <View>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="name..."
                  value={firstName}
                  onChangeText={setFirstName}
                />

                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="surname..."
                  value={lastName}
                  onChangeText={setLastName}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="enter email address..."
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="enter password..."
                  placeholderTextColor="#aaa"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalCreateButton}
                  onPress={handleSignUp}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBackText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 70,
  },
  box: {
    borderWidth: 0.3,
    borderColor: '#9e9e9eff',
    borderRadius: 8,
    paddingVertical: 90,
    paddingHorizontal: 25,
    width: '100%',
    maxWidth: 350,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
    marginBottom: 30,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 50,
  },
  sectionTitle: {
    textAlign: 'center',
    color: '#777',
    marginBottom: 10,
    fontSize: 13,
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#b6b6b6ff',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  logInButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#969696ff',
    alignSelf: 'center',
    width: '70%',
  },
  logInText: {
    color: '#333',
    fontWeight: '500',
  },

  signUpButton: {
    backgroundColor: '#fff9e3ff',
    borderWidth: 1,
    borderColor: '#969696ff',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'center',
    width: '50%',
  },

  signUpButtonText: {
    color: '#333',
    fontWeight: '500',
  },

  modalOverlay: { 
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  label: { 
    color: '#555',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'left',
  },
  modalButtonContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 15,
  },
  modalCreateButton: { 
    backgroundColor: '#333',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  modalBackButton: { 
    backgroundColor: '#d7d7d7ff',
    color: "black" ,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
  },

    modalBackText: { 
    color: '#000000ff',
    fontWeight: '500',
    
  },

  modalButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});