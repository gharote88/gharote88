import React from 'react';
import { Text, View } from 'react-native';

// App.tsx is not the entry point — expo-router uses _layout.tsx + file-based routing.
// See packages/app/_layout.tsx and packages/app/index.tsx.
export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>मराठी शिका</Text>
      <Text>Learn Marathi</Text>
    </View>
  );
}
