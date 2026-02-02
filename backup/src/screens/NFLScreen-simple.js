import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NFLScreenSimple({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NFL Analytics</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.text}>NFL Screen - Working 🏈</Text>
        <Text style={styles.note}>Will add premium gating with RevenueCat later</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 20, marginBottom: 20 },
  note: { color: '#94a3b8', fontSize: 16, textAlign: 'center' },
});
