import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function SimpleTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App is working!</Text>
      <Text style={styles.subtext}>All components loaded successfully</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
  },
})
