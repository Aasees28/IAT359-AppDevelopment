import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Log in</Text>

        <Text style={styles.subtitle}>
          or{' '}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Signup')}>
            sign up
          </Text>
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>continue with Email</Text>
        <TextInput
          style={styles.input}
          placeholder="enter email address..."
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Home')}   // 👈 Add this line
        >
          <Text style={styles.continueText}>continue</Text>
        </TouchableOpacity>


        <View style={styles.divider} />
        <TouchableOpacity>
          <Text style={styles.skipText}>skip for now</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 70, // 🔹 add this line to push everything down
  },
  box: {
    borderWidth: 0.3, // thin border
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
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueText: {
    color: '#333',
    fontWeight: '500',
  },
  smallLink: {
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    textDecorationLine: 'underline',
    marginTop: 6,
  },
  skipText: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#555',
    marginTop: 10,
    fontSize: 13,
  },
});
