import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Component Imports
import { VoiceOrb, OrbState } from './components/VoiceOrb';
import { SuggestionChips } from './components/SuggestionChips';
import { ChatBubble } from './components/ChatBubble';
import { DoctorCard } from './components/DoctorCard';
import { AppointmentCard } from './components/AppointmentCard';
import { PrescriptionCard } from './components/PrescriptionCard';
import { NavigationCard } from './components/NavigationCard';
import { ClinicMap } from './components/ClinicMap';

// Hook Imports
import { useChat } from './hooks/useChat';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const { width } = Dimensions.get('window');
const PATIENT_ID = '10000000-0000-0000-0000-000000000000'; // Default test patient (Rahul Sharma)

export default function App() {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'map'>('voice');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [inputText, setInputText] = useState('');
  const [currentTranscription, setCurrentTranscription] = useState('');
  
  // Indoor Wayfinding Map state
  const [activeMapPath, setActiveMapPath] = useState<'lobby' | 'pharmacy' | 'cardiology' | 'pediatrics' | 'dermatology' | null>(null);
  const [mapDirections, setMapDirections] = useState<string[]>([]);
  const [mapDestName, setMapDestName] = useState('');

  const chatListRef = useRef<FlatList>(null);

  // Initialize Chat Hook
  const { messages, sendMessage, selectDoctorSlot, isSpeaking, stopSpeaking } = useChat(
    PATIENT_ID,
    (state) => setOrbState(state)
  );

  // Initialize Speech Recognition Hook
  const { startListening, stopListening, isListening } = useSpeechRecognition({
    onResult: (text) => {
      setCurrentTranscription(text);
      sendMessage(text);
      // Automatically switch to chat tab when a query is processed so user can see cards
      setActiveTab('chat');
    },
    onStateChange: (state) => setOrbState(state)
  });

  // Scroll chat list to bottom on new messages
  useEffect(() => {
    if (activeTab === 'chat' && chatListRef.current && messages.length > 0) {
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, activeTab]);

  const handleOrbPress = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      setCurrentTranscription('');
      startListening();
    }
  };

  const handleTextInputSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setActiveTab('chat');
  };

  const handleSuggestionChipPress = (query: string) => {
    sendMessage(query);
    setActiveTab('chat');
  };

  const triggerWayfinding = (navData: { path: any; directions: string[]; destination: string }) => {
    setActiveMapPath(navData.path);
    setMapDirections(navData.directions);
    setMapDestName(navData.destination);
    setActiveTab('map');
  };

  // Render cards depending on type inside chat bubbles
  const renderCardContent = (cardType: string, cardData: any) => {
    if (!cardData) return null;

    switch (cardType) {
      case 'suggested_appointments':
        return (
          <View style={styles.cardWrapper}>
            <Text style={styles.cardLabel}>Select a convenient time slot:</Text>
            <View style={styles.slotsGrid}>
              {cardData.slots.map((slot: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.slotBtn}
                  onPress={() => selectDoctorSlot(
                    cardData.doctor,
                    slot,
                    cardData.isRescheduling,
                    cardData.oldAppointmentId
                  )}
                  activeOpacity={0.7}
                >
                  <Text style={styles.slotBtnText}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'doctor':
        return Array.isArray(cardData) ? (
          cardData.map((doc, idx) => (
            <DoctorCard
              key={idx}
              doctor={doc}
              onBookPress={(d) => sendMessage(`Book an appointment with ${d.full_name}`)}
            />
          ))
        ) : (
          <DoctorCard
            doctor={cardData}
            onBookPress={(d) => sendMessage(`Book an appointment with ${d.full_name}`)}
          />
        );

      case 'appointment':
        return (
          <AppointmentCard
            appointment={cardData}
            isConfirmedView={true}
            onNavigatePress={(room) => sendMessage(`Where is ${room}?`)}
            onCancelPress={(id) => sendMessage(`Cancel my appointment`)}
          />
        );

      case 'prescription':
        return <PrescriptionCard prescription={cardData} />;

      case 'navigation':
        return (
          <NavigationCard
            destination={cardData.destination}
            room={cardData.room}
            directions={cardData.directions}
            onStartNavPress={() => triggerWayfinding(cardData)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>🩺 MedConnect</Text>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineText}>Voice Live</Text>
          </View>
        </View>
        <Text style={styles.patientName}>Patient: Rahul Sharma</Text>
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'voice' && styles.activeTab]}
          onPress={() => setActiveTab('voice')}
        >
          <Text style={[styles.tabText, activeTab === 'voice' && styles.activeTabText]}>🎤 Assistant</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>💬 Chat ({messages.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.activeTab]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>🗺️ Clinic Map</Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Views */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.viewContainer}
      >
        {/* VOICE ASSISTANT VIEW */}
        {activeTab === 'voice' && (
          <View style={styles.voiceView}>
            <View style={styles.statusBox}>
              <Text style={styles.assistantTitle}>How can I help you today?</Text>
              <Text style={styles.subtext}>
                {orbState === 'idle' && 'Tap the button and start speaking.'}
                {orbState === 'listening' && 'Listening to your voice... speak now.'}
                {orbState === 'processing' && 'Understanding your request...'}
                {orbState === 'speaking' && 'Speaking response aloud.'}
              </Text>
            </View>

            {/* Display user live text transcription if listening */}
            {currentTranscription !== '' && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionText}>"{currentTranscription}"</Text>
              </View>
            )}

            <View style={styles.orbWrapper}>
              <VoiceOrb state={orbState} onPress={handleOrbPress} />
            </View>

            <View style={styles.chipsWrapper}>
              <Text style={styles.chipsTitle}>Suggested Intents</Text>
              <SuggestionChips onChipPress={handleSuggestionChipPress} />
            </View>
          </View>
        )}

        {/* DETAILED CHAT HISTORY VIEW */}
        {activeTab === 'chat' && (
          <View style={styles.chatView}>
            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatListContent}
              renderItem={({ item }) => (
                <ChatBubble message={item}>
                  {item.cardType && renderCardContent(item.cardType, item.cardData)}
                </ChatBubble>
              )}
            />

            {/* Text Input Footer for Chat View */}
            <View style={styles.inputBar}>
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={handleOrbPress}
                activeOpacity={0.7}
              >
                <Text style={styles.micBtnText}>{isListening ? '🛑' : '🎤'}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder="Type your health request..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleTextInputSend}
              />

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleTextInputSend}
                activeOpacity={0.7}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* WAYFINDING / CLINIC MAP VIEW */}
        {activeTab === 'map' && (
          <View style={styles.mapView}>
            <ClinicMap activePath={activeMapPath} />

            <View style={styles.mapDirectionsCard}>
              <Text style={styles.directionsTitle}>
                {mapDestName ? `🚶 Directions to ${mapDestName}` : '📍 Indoor Wayfinding'}
              </Text>
              
              {mapDirections.length > 0 ? (
                <FlatList
                  data={mapDirections}
                  keyExtractor={(_, idx) => idx.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.mapStepRow}>
                      <Text style={styles.mapStepNum}>{index + 1}</Text>
                      <Text style={styles.mapStepText}>{item}</Text>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.noRouteContainer}>
                  <Text style={styles.noRouteText}>No active route loaded. Ask the Voice Assistant "Where is Room 302?" or "Where is the pharmacy?" to draw a path.</Text>
                  
                  {/* Quick Map Routes Trigger */}
                  <View style={styles.quickRoutesBox}>
                    <Text style={styles.quickTitle}>Quick Test Routes:</Text>
                    <View style={styles.quickRoutesRow}>
                      <TouchableOpacity
                        style={styles.quickRouteBtn}
                        onPress={() => triggerWayfinding({
                          path: 'pharmacy',
                          destination: 'Pharmacy (Room 102)',
                          directions: ['Exit main lobby right.', 'Take the first left hallway.', 'Pharmacy is on your right side.']
                        })}
                      >
                        <Text style={styles.quickRouteText}>Pharmacy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickRouteBtn}
                        onPress={() => triggerWayfinding({
                          path: 'cardiology',
                          destination: 'Dr. Anita Desai (Cardiology - Rm 302)',
                          directions: ['Walk past reception to the elevators.', 'Take elevators to the 3rd Floor.', 'Room 302 is the last door on left.']
                        })}
                      >
                        <Text style={styles.quickRouteText}>Cardiology</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  onlineBadge: {
    backgroundColor: '#e6fffa',
    borderColor: '#319795',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 8,
  },
  onlineText: {
    color: '#319795',
    fontSize: 9,
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f1f5f9',
  },
  tabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#0d9488', // teal-600
    fontWeight: 'bold',
  },
  viewContainer: {
    flex: 1,
  },
  // Voice Panel Styles
  voiceView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 30,
  },
  statusBox: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  assistantTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  transcriptionBox: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    maxWidth: width - 40,
    marginVertical: 10,
  },
  transcriptionText: {
    color: '#0d9488',
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  orbWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsWrapper: {
    width: '100%',
    paddingTop: 10,
  },
  chipsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 20,
    marginBottom: -4,
  },
  // Chat Panel Styles
  chatView: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  chatListContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
    marginHorizontal: 8,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  micBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  micBtnText: {
    fontSize: 18,
  },
  sendBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Card slots inside Chat bubbles
  cardWrapper: {
    marginTop: 8,
    width: '100%',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotBtn: {
    backgroundColor: '#e6fffa',
    borderWidth: 1,
    borderColor: '#b2f5ea',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  slotBtnText: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '700',
  },
  // Map Screen Styles
  mapView: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  mapDirectionsCard: {
    flex: 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  directionsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  mapStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  mapStepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e0f2fe',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369a1',
    marginRight: 8,
    lineHeight: 18,
  },
  mapStepText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  noRouteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  noRouteText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  quickRoutesBox: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  quickRoutesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickRouteBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 5,
  },
  quickRouteText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
});
