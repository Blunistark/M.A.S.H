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
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Central Theme Import
import { Theme } from './theme';

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
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

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

    }
  };

  if (!fontsLoaded) {
    return null;
  }

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
                  {!!item.cardType && renderCardContent(item.cardType, item.cardData)}
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
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: Theme.colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightGray,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.headlineSm.fontSize,
    color: Theme.colors.onSurface,
  },
  onlineBadge: {
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.roundness.sm,
    marginLeft: 8,
  },
  onlineText: {
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.secondary,
    fontSize: 10,
  },
  patientName: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.onSurfaceVariant,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.containerPadding,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Theme.roundness.full,
  },
  activeTab: {
    backgroundColor: Theme.colors.superLightGray,
  },
  tabText: {
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: Theme.typography.labelMd.fontSize,
    color: Theme.colors.onSurfaceVariant,
  },
  activeTabText: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  viewContainer: {
    flex: 1,
  },
  // Voice Panel Styles
  voiceView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.containerPadding,
    backgroundColor: Theme.colors.background,
  },
  statusBox: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.containerPadding,
  },
  assistantTitle: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.headlineMd.fontSize,
    lineHeight: Theme.typography.headlineMd.lineHeight,
    color: Theme.colors.onSurface,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.bodyMd.fontSize,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: Theme.typography.bodyMd.lineHeight,
  },
  transcriptionBox: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    maxWidth: width - 48,
    marginVertical: 10,
    ...Theme.shadows.level1,
  },
  transcriptionText: {
    fontFamily: Theme.typography.fontFamilySemiBold,
    color: Theme.colors.primary,
    fontSize: Theme.typography.bodyMd.fontSize,
    fontStyle: 'italic',
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
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: Theme.spacing.containerPadding,
    marginBottom: 4,
  },
  // Chat Panel Styles
  chatView: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  chatListContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingVertical: 12,
    backgroundColor: Theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.lightGray,
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.bodyMd.fontSize,
    height: Theme.spacing.inputHeight,
    backgroundColor: Theme.colors.superLightGray,
    borderRadius: Theme.roundness.full,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    color: Theme.colors.onSurface,
    marginHorizontal: 8,
  },
  micBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.superLightGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
  },
  micBtnActive: {
    backgroundColor: Theme.colors.errorContainer,
    borderColor: Theme.colors.error,
  },
  micBtnText: {
    fontSize: 20,
  },
  sendBtn: {
    backgroundColor: Theme.colors.primary,
    height: Theme.spacing.buttonHeight,
    borderRadius: Theme.roundness.full,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.level1,
  },
  sendBtnText: {
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
  // Card slots inside Chat bubbles
  cardWrapper: {
    marginTop: 12,
    width: '100%',
  },
  cardLabel: {
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: Theme.typography.labelMd.fontSize,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotBtn: {
    backgroundColor: Theme.colors.secondaryContainer,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
  },
  slotBtnText: {
    color: Theme.colors.secondary,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelSm.fontSize,
  },
  // Map Screen Styles
  mapView: {
    flex: 1,
    padding: Theme.spacing.containerPadding,
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
  },
  mapDirectionsCard: {
    flex: 0.9,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.cardPadding,
    marginTop: 16,
    ...Theme.shadows.level1,
  },
  directionsTitle: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.bodyLg.fontSize,
    color: Theme.colors.onSurface,
    marginBottom: 12,
  },
  mapStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  mapStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.secondaryContainer,
    textAlign: 'center',
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.secondary,
    marginRight: 8,
    lineHeight: 22,
  },
  mapStepText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.bodyMd.fontSize,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
  noRouteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  noRouteText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.bodyMd.fontSize,
    color: Theme.colors.outline,
    textAlign: 'center',
    lineHeight: Theme.typography.bodyMd.lineHeight,
  },
  quickRoutesBox: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  quickTitle: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.outline,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  quickRoutesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickRouteBtn: {
    backgroundColor: Theme.colors.superLightGray,
    borderRadius: Theme.roundness.full,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
  },
  quickRouteText: {
    color: Theme.colors.onSurfaceVariant,
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: Theme.typography.labelSm.fontSize,
  },
});
