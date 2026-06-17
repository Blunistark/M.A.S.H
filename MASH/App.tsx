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
  Dimensions,
  Image,
  Modal,
  Animated,
  ScrollView,
  Alert,
  Easing,
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
import { VoiceOrb } from './components/VoiceOrb';
import { LinearGradient } from 'expo-linear-gradient';
import { SuggestionChips } from './components/SuggestionChips';
import { ChatBubble } from './components/ChatBubble';
import { DoctorCard } from './components/DoctorCard';
import { AppointmentCard } from './components/AppointmentCard';
import { PrescriptionCard } from './components/PrescriptionCard';
import { NavigationCard } from './components/NavigationCard';
import { ClinicMap } from './components/ClinicMap';
import { AppointmentConfirmation } from './components/AppointmentConfirmation';
// import { AuthScreen } from './components/AuthScreen';
import { api } from './services/api';

// Hook Imports
import { useChat } from './hooks/useChat';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const { width } = Dimensions.get('window');
const PATIENT_ID = '10000000-0000-0000-0000-000000000000'; // Default test patient (Rahul Sharma)

// Emojis mapping for general icons
const HOME_ICON = '🏠';
const CHAT_ICON = '💬';
const PROFILE_ICON = '👤';
const COMPASS_ICON = '🧭';
const NOTIFICATION_ICON = '🔔';
const SEARCH_ICON = '🔍';
const MIC_ICON = '🎤';
const SEND_ICON = '➔';
const BACK_ICON = '←';

// Mock appointment details fallback matching reference Dr. Sarah Smith Cardiology Dept
const DEFAULT_APPOINTMENT: any = {
  id: 'appt-default-123',
  patient_id: PATIENT_ID,
  doctor_id: 'doc-smith-456',
  doctor_name: 'Dr. Sarah Smith',
  specialty: 'General Practitioner',
  scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  status: 'scheduled',
  room_number: '204',
};

// Sub-component for animated voice equalizer bars in immersive overlay (Warm gold colors)
const EqualizerBar = ({ delay }: { delay: number }) => {
  const heightVal = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    let anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(heightVal, {
          toValue: Math.random() * 32 + 16,
          duration: 350,
          useNativeDriver: false,
        }),
        Animated.timing(heightVal, {
          toValue: 8,
          duration: 350,
          useNativeDriver: false,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[styles.eqBar, { height: heightVal }]} />;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [session, setSession] = useState<any>({
    id: 'mock-session-id',
    user: { id: PATIENT_ID },
  });
  const [profile, setProfile] = useState<any>({
    id: PATIENT_ID,
    full_name: 'Alex Mercer',
    email: 'alex.mercer@gmail.com',
  });

  // Bottom navigation tabs: 'home' | 'chat' | 'profile'
  const [screen, setScreen] = useState<'home' | 'chat' | 'profile'>('home');

  // Sub-navigation state for chat tab (inline task flow)
  // 'chat_list' | 'appointment_confirm' | 'indoor_nav'
  const [chatSubScreen, setChatSubScreen] = useState<'chat_list' | 'appointment_confirm' | 'indoor_nav'>('chat_list');
  
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isVoiceOverlayVisible, setIsVoiceOverlayVisible] = useState(false);
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [inputText, setInputText] = useState('');
  const [currentTranscription, setCurrentTranscription] = useState('');

  // Indoor Wayfinding Map state
  const [activeMapPath, setActiveMapPath] = useState<'lobby' | 'pharmacy' | 'cardiology' | 'pediatrics' | 'dermatology' | null>(null);
  const [mapDirections, setMapDirections] = useState<string[]>([]);
  const [mapDestName, setMapDestName] = useState('');
  const [navStarted, setNavStarted] = useState(false);
  const [navStatusText, setNavStatusText] = useState('Start Navigation');

  const chatListRef = useRef<FlatList>(null);

  const navigateToScreen = (targetScreen: 'home' | 'chat' | 'profile', subScreen?: 'chat_list' | 'appointment_confirm' | 'indoor_nav') => {
    setScreen(targetScreen);
    if (targetScreen === 'chat') {
      setChatSubScreen(subScreen || 'chat_list');
    }
  };

  // Initialize Chat Hook
  const { messages, sendMessage, selectDoctorSlot, isSpeaking, stopSpeaking } = useChat(
    profile?.id || PATIENT_ID,
    (state) => setOrbState(state)
  );

  // Initialize Speech Recognition Hook
  const { startListening, stopListening, isListening } = useSpeechRecognition({
    onResult: (text) => {
      setCurrentTranscription(text);
      sendMessage(text);
      setIsVoiceOverlayVisible(false);
      navigateToScreen('chat', 'chat_list');
    },
    onStateChange: (state) => setOrbState(state),
  });

  // Scroll chat list to bottom on new messages
  useEffect(() => {
    if (screen === 'chat' && chatSubScreen === 'chat_list' && chatListRef.current && messages.length > 0) {
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, screen, chatSubScreen]);

  // Voice Interaction Hub Press Handlers
  const handleOrbPress = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setCurrentTranscription('');
    startListening();
    setIsVoiceOverlayVisible(true);
  };

  const handleCloseVoiceOverlay = () => {
    stopListening();
    setIsVoiceOverlayVisible(false);
  };

  const handleTextInputSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    navigateToScreen('chat', 'chat_list');
  };

  const handleSuggestionChipPress = (query: string) => {
    sendMessage(query);
    navigateToScreen('chat', 'chat_list');
  };

  const triggerWayfinding = (navData: { path: any; directions: string[]; destination: string }) => {
    setActiveMapPath(navData.path);
    setMapDirections(navData.directions);
    setMapDestName(navData.destination);
    navigateToScreen('chat', 'indoor_nav');
    setNavStarted(false);
    setNavStatusText('Start Navigation');
  };

  const handleStartNavigation = () => {
    setNavStatusText('Starting...');
    setTimeout(() => {
      setNavStarted(true);
      setNavStatusText('Navigation Started');
    }, 1200);
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
        // Inside chat thread, clicking View Details takes user to Appointment Confirmation screen state
        return (
          <AppointmentCard
            appointment={cardData}
            onViewDetails={() => {
              setSelectedAppointment(cardData);
              setChatSubScreen('appointment_confirm');
            }}
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

  if (!fontsLoaded) {
    return null;
  }

  // Alex Mercer user avatar image from design spec
  const userAvatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4dV8furgxt6lfQHMCGAKgfsHz-ruAhxrax0kqrHBE207XdXcd9g96NFbpK_CGRBZt1lo40a-V9VJU7nwVKC1VRlu2GgzlzyUzZlAjWNWEq76TFjuIxLt8ukfmTLzMAFk7uhr4ElENTlfi5BEDI_EDww18ne9K2BEJVY61iF79IqXAJrQIlW0BbEuc1tEcwU8uiLYPYlkzziRfwy31hMGGv2lLAae4RFXjzmYVbSiCoPLkF_JDK7N8YmV-wpYTnlqnp-E3T-KKfiqA';

  // Render header - Hidden on Indoor Navigation subpage to match full view map aesthetics
  const renderHeader = () => {
    if (screen === 'chat' && chatSubScreen === 'indoor_nav') return null;

    return (
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
          <Text style={styles.avatarGreeting}>Good morning, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Alex'}</Text>
        </View>
        <TouchableOpacity style={styles.headerNotificationBtn} activeOpacity={0.7}>
          <Text style={styles.notificationIcon}>{NOTIFICATION_ICON}</Text>
        </TouchableOpacity>
      </View>
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: Theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.viewContent}>
          {screen === 'home' && (
            <View style={{ flex: 1 }}>
              <View style={styles.voiceView}>
                <View style={styles.orbWrapper}>
                  <VoiceOrb onPress={handleOrbPress} state={orbState} />
                </View>

                {/* Chips at the bottom of the Home view */}
                <View style={styles.chipsWrapper}>
                  <SuggestionChips onChipPress={handleSuggestionChipPress} />
                </View>
              </View>
            </View>
          )}

          {screen === 'chat' && (
            <View style={{ flex: 1 }}>
              {chatSubScreen === 'indoor_nav' && (
                <View style={styles.indoorNavContainer}>
                  {/* Custom Header with Back Button */}
                  <View style={styles.navHeader}>
                    <TouchableOpacity
                      style={styles.navBackBtn}
                      onPress={() => {
                        setChatSubScreen('appointment_confirm');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.navBackIcon}>{BACK_ICON}</Text>
                    </TouchableOpacity>
                    <Text style={styles.navHeaderTitle}>Navigation</Text>
                    <View style={styles.navHeaderSpacer} />
                  </View>

                  <ScrollView
                    style={styles.navScroll}
                    contentContainerStyle={styles.navScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <ClinicMap activePath={activeMapPath} navigationActive={navStarted} />

                    <View style={styles.mapStatsCard}>
                      <View style={styles.mapDragHandle} />
                      
                      <View style={styles.destHeader}>
                        <Text style={styles.destIcon}>🩺</Text>
                        <View>
                          <Text style={styles.destTitle}>{mapDestName || "Dr. Smith's Room - 204"}</Text>
                          <Text style={styles.destSub}>Cardiology Department • 2nd Floor</Text>
                        </View>
                      </View>

                      <View style={styles.statsRow}>
                        <View style={styles.statPill}>
                          <Text style={styles.statPillIcon}>📏</Text>
                          <Text style={styles.statPillText}>150m</Text>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: Theme.colors.secondaryContainer }]}>
                          <Text style={[styles.statPillIcon, { color: Theme.colors.secondary }]}>⏰</Text>
                          <Text style={[styles.statPillText, { color: Theme.colors.secondary }]}>2 min</Text>
                        </View>
                      </View>

                      <View style={styles.stepsListWrapper}>
                        {mapDirections.map((step, index) => (
                          <View key={index} style={styles.mapStepRow}>
                            <Text style={styles.mapStepNum}>{index + 1}</Text>
                            <Text style={styles.mapStepText}>{step}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.navActionRow}>
                        <TouchableOpacity
                          style={[
                            styles.startNavBtn,
                            navStarted && { backgroundColor: Theme.colors.secondary }
                          ]}
                          onPress={handleStartNavigation}
                          disabled={navStarted}
                          activeOpacity={0.8}
                        >
                          {navStatusText === 'Starting...' ? (
                            <Text style={styles.startNavBtnText}>Starting...</Text>
                          ) : navStatusText === 'Navigation Started' ? (
                            <Text style={styles.startNavBtnText}>✓ Navigation Started</Text>
                          ) : (
                            <Text style={styles.startNavBtnText}>🧭 Start Navigation</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.clearRouteBtn}
                          onPress={() => {
                            setActiveMapPath(null);
                            setMapDirections([]);
                            setMapDestName('');
                            setNavStarted(false);
                            setNavStatusText('Start Navigation');
                            setChatSubScreen('appointment_confirm');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.clearRouteText}>Exit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              )}

              {chatSubScreen === 'chat_list' && (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                  style={styles.chatView}
                >
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

                  <View style={styles.chatInputWrapper}>
                    <View style={styles.glassPanel}>
                      <View style={styles.inputSearchIconBox}>
                        <Text style={styles.searchIcon}>{SEARCH_ICON}</Text>
                      </View>
                      <TextInput
                        style={styles.floatingTextInput}
                        placeholder="Ask anything about your health..."
                        placeholderTextColor="rgba(164, 176, 190, 0.4)"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleTextInputSend}
                      />
                      <View style={styles.inputActionRow}>
                        <TouchableOpacity style={styles.inputMicBtn} onPress={handleOrbPress} activeOpacity={0.7}>
                          <Text style={styles.inputMicBtnText}>{MIC_ICON}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.inputSendBtn} onPress={handleTextInputSend} activeOpacity={0.7}>
                          <Text style={styles.inputSendBtnText}>{SEND_ICON}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              )}

              {chatSubScreen === 'appointment_confirm' && (
                <View style={styles.subpageWrapper}>
                  <View style={styles.subpageHeader}>
                    <TouchableOpacity
                      style={styles.subpageBackBtn}
                      onPress={() => setChatSubScreen('chat_list')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subpageBackIcon}>{BACK_ICON} Back to Chat</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <AppointmentConfirmation
                    appointment={selectedAppointment || DEFAULT_APPOINTMENT}
                    onGetDirections={() => {
                      triggerWayfinding({
                        path: 'cardiology',
                        destination: "Dr. Smith's Room - 204",
                        directions: [
                          'Enter the main clinic reception lobby.',
                          'Follow the corridor straight ahead.',
                          'Take Room 204 on the second floor Cardiology wing.'
                        ]
                      });
                    }}
                    onReschedule={() => {
                      sendMessage("Reschedule my appointment with Dr. Sarah Smith");
                      setChatSubScreen('chat_list');
                    }}
                    onCancel={() => {
                      sendMessage("Cancel my appointment with Dr. Sarah Smith");
                      setChatSubScreen('chat_list');
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {screen === 'profile' && (
            <View style={{ flex: 1 }}>
              <View style={styles.profileView}>
                <View style={styles.profileCard}>
                  <Image source={{ uri: userAvatarUrl }} style={styles.largeProfileImage} />
                  <Text style={styles.profileName}>{profile?.full_name || 'Alex Mercer'}</Text>
                  <Text style={styles.profileMeta}>
                    Patient ID: {profile?.id ? profile.id.substring(0, 8).toUpperCase() : 'PHR-884-206'}
                  </Text>

                  <View style={styles.phrGrid}>
                    <View style={styles.phrBox}>
                      <Text style={styles.phrLabel}>🩺 PRIMARY GP</Text>
                      <Text style={styles.phrValue}>Dr. Sarah Smith</Text>
                    </View>
                    <View style={styles.phrBox}>
                      <Text style={styles.phrLabel}>❤️ VITALS STATUS</Text>
                      <Text style={styles.phrValue}>Normal (72 BPM)</Text>
                    </View>
                  </View>

                  <View style={styles.phrMedRecords}>
                    <Text style={styles.medsTitle}>Active Records</Text>
                    <View style={styles.medRow}>
                      <Text style={styles.medBullet}>•</Text>
                      <Text style={styles.medText}>Cardiology Vitals Checkup scheduled tomorrow</Text>
                    </View>
                    <View style={styles.medRow}>
                      <Text style={styles.medBullet}>•</Text>
                      <Text style={styles.medText}>Lisinopril 10mg - 1 Tab daily</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

      {/* Global Bottom Tab Navigation */}
      <View style={styles.bottomTabBar}>
        {/* Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToScreen('home')}
          activeOpacity={0.8}
        >
          {screen === 'home' ? (
            <View style={styles.activeTabCapsule}>
              <Text style={styles.tabIconActive}>{HOME_ICON}</Text>
              <Text style={styles.tabLabelActive}>Home</Text>
            </View>
          ) : (
            <View style={styles.inactiveTabContainer}>
              <Text style={styles.tabIconInactive}>{HOME_ICON}</Text>
              <Text style={styles.tabLabelInactive}>Home</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToScreen('chat', 'chat_list')}
          activeOpacity={0.8}
        >
          {screen === 'chat' ? (
            <View style={styles.activeTabCapsule}>
              <Text style={styles.tabIconActive}>{CHAT_ICON}</Text>
              <Text style={styles.tabLabelActive}>Chat</Text>
            </View>
          ) : (
            <View style={styles.inactiveTabContainer}>
              <Text style={styles.tabIconInactive}>{CHAT_ICON}</Text>
              <Text style={styles.tabLabelInactive}>Chat</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToScreen('profile')}
          activeOpacity={0.8}
        >
          {screen === 'profile' ? (
            <View style={styles.activeTabCapsule}>
              <Text style={styles.tabIconActive}>{PROFILE_ICON}</Text>
              <Text style={styles.tabLabelActive}>Profile</Text>
            </View>
          ) : (
            <View style={styles.inactiveTabContainer}>
              <Text style={styles.tabIconInactive}>{PROFILE_ICON}</Text>
              <Text style={styles.tabLabelInactive}>Profile</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Immersive Fullscreen Voice Mode Overlay Modal */}
      <Modal
        visible={isVoiceOverlayVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseVoiceOverlay}
      >
        <LinearGradient
          colors={['#001a1d', '#000f11']}
          style={styles.overlayContainer}
        >
          <TouchableOpacity
            style={styles.closeOverlayBtn}
            onPress={handleCloseVoiceOverlay}
            activeOpacity={0.7}
          >
            <Text style={styles.closeOverlayText}>✕</Text>
          </TouchableOpacity>

          {/* Glowing central sphere */}
          <View style={styles.overlayOrbWrapper}>
            <VoiceOrb onPress={handleCloseVoiceOverlay} state={orbState} />
          </View>

          <View style={styles.overlayTextBox}>
            <View style={styles.listeningBadge}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningBadgeText}>Listening...</Text>
            </View>

            <Text style={styles.overlayInstruction}>How can I help you, Alex?</Text>

            {/* Waveform gold indicator bars */}
            <View style={styles.waveformContainer}>
              <EqualizerBar delay={0} />
              <EqualizerBar delay={150} />
              <EqualizerBar delay={300} />
              <EqualizerBar delay={100} />
              <EqualizerBar delay={200} />
            </View>

            {/* Live voice transcription */}
            {currentTranscription !== '' && (
              <View style={styles.overlayTranscriptionCard}>
                <Text style={styles.overlayTranscriptionText}>
                  "{currentTranscription}"
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 8, // Compact
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 32, // Compact (32x32)
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  avatarGreeting: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 14, // Compact/shrunk
    color: Theme.colors.onSurface, // Clinical onSurface text
    marginLeft: 8,
  },
  headerNotificationBtn: {
    width: 36, // Shrunk
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.superLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 16,
    color: Theme.colors.primary, // Primary blue icon
  },
  viewContent: {
    flex: 1,
  },
  // Voice Panel Styles
  voiceView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 96, // Safe distance from bottom tab bar
  },
  statusBox: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.containerPadding,
  },
  assistantTitle: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 20, // Shrunk/compact title
    lineHeight: 26,
    color: Theme.colors.onSurface,
    textAlign: 'center',
    maxWidth: 240,
  },
  orbWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  chipsWrapper: {
    width: '100%',
  },
  tabInputWrapper: {
    width: '100%',
    paddingHorizontal: Theme.spacing.containerPadding,
    position: 'absolute',
    bottom: 96, // Floats above bottom tab bar
  },
  // Chat Tab Styles
  chatTabContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatView: {
    flex: 1,
  },
  chatListContent: {
    paddingVertical: 12,
    paddingBottom: 110, // Safe padding above bottom fixed chat input bar
  },
  chatInputWrapper: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
  },
  // Inline Confirmation Screen Styles
  subpageWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  subpageHeader: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.containerPadding,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outline,
  },
  subpageBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subpageBackIcon: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 13,
    color: Theme.colors.secondary,
  },
  // Map/Navigation Styles (Light layout)
  indoorNavContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  navScroll: {
    flex: 1,
  },
  navScrollContent: {
    paddingTop: 80, // Space for absolute header
    paddingBottom: 110, // Safe padding above bottom tab bar
  },
  navHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.containerPadding,
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 20,
    left: 0,
    right: 0,
    zIndex: 45,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  navBackIcon: {
    fontSize: 16,
    color: Theme.colors.secondary,
    fontWeight: 'bold',
  },
  navHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  navHeaderSpacer: {
    width: 36,
  },
  mapStatsCard: {
    backgroundColor: Theme.colors.surface, // Light card background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: Theme.spacing.containerPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
    marginTop: -20,
    zIndex: 10,
  },
  mapDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.outline,
    alignSelf: 'center',
    marginBottom: 12,
  },
  destHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  destIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  destTitle: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  destSub: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    backgroundColor: Theme.colors.secondaryContainer,
    borderRadius: Theme.roundness.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  statPillText: {
    fontSize: 11,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.secondary,
  },
  stepsListWrapper: {
    marginBottom: 12,
    maxHeight: 110,
  },
  mapStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  mapStepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.primaryContainer,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.secondary,
    marginRight: 8,
    lineHeight: 18,
  },
  mapStepText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
  navActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  startNavBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary, // Pink primary
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNavBtnText: {
    color: '#ffffff',
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 13,
  },
  clearRouteBtn: {
    width: 80,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearRouteText: {
    color: Theme.colors.onSurfaceVariant,
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: 13,
  },
  // Floating Input Console Style (Applied Light Pink Theme)
  glassPanel: {
    backgroundColor: '#ffffff', // Solid white input container
    borderRadius: 28,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Theme.colors.shadowColor, // Soft blue-cyan glow tint
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant, // Light blue-gray border
  },
  inputSearchIconBox: {
    paddingLeft: 10,
    paddingRight: 4,
  },
  searchIcon: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
  },
  floatingTextInput: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily,
    fontSize: 13,
    height: 38,
    color: Theme.colors.onSurface,
  },
  inputActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputMicBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputMicBtnText: {
    fontSize: 14,
    color: Theme.colors.secondary,
  },
  inputSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Bottom Tab Navigation Bar (Light Theme with active capsule highlights)
  bottomTabBar: {
    height: 72,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eceef0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryContainer, // #62fae3
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  inactiveTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  tabIconActive: {
    fontSize: 18,
    color: Theme.colors.secondary, // #006b5f
  },
  tabIconInactive: {
    fontSize: 18,
    color: Theme.colors.outline, // #717786
  },
  tabLabelActive: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 12,
    color: Theme.colors.secondary, // #006b5f
  },
  tabLabelInactive: {
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: Theme.colors.outline, // #717786
  },
  // Profile / PHR View Styles
  profileView: {
    flex: 1,
    padding: Theme.spacing.containerPadding,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  profileCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.cardPadding,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  largeProfileImage: {
    width: 70, // Shrunk profile pic
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: Theme.colors.outline,
    marginBottom: 12,
  },
  profileName: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  profileMeta: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 16,
  },
  phrGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  phrBox: {
    flex: 1,
    backgroundColor: Theme.colors.superLightGray,
    borderRadius: Theme.roundness.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  phrLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  phrValue: {
    fontSize: 12,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.secondary,
    marginTop: 4,
  },
  phrMedRecords: {
    width: '100%',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outline,
    paddingTop: 12,
  },
  medsTitle: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
    marginBottom: 8,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
  },
  medBullet: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginRight: 6,
  },
  medText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
  // Immersive Voice Mode Overlay (Light pink theme)
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.containerPadding,
  },
  closeOverlayBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent button
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeOverlayText: {
    color: '#ffffff', // White close icon
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayOrbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
    marginBottom: 32,
  },
  overlayOrbGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Theme.colors.secondaryContainer, // Teal glow
    opacity: 0.2,
    shadowColor: Theme.colors.secondaryContainer,
    shadowRadius: 50,
    shadowOpacity: 0.6,
  },
  overlayOrbCore: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 26, 29, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.secondaryContainer,
    shadowColor: Theme.colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  overlayOrbIcon: {
    fontSize: 36,
  },
  overlayTextBox: {
    alignItems: 'center',
    width: '100%',
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(98, 250, 227, 0.2)',
    marginBottom: 12,
  },
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#62fae3', // Teal dot
    marginRight: 6,
  },
  listeningBadgeText: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 10,
    color: '#62fae3', // Teal text
  },
  overlayInstruction: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 18,
    color: '#ffffff', // White instruction text
    textAlign: 'center',
    marginBottom: 24,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    height: 50,
    marginBottom: 32,
  },
  eqBar: {
    width: 5,
    backgroundColor: '#62fae3', // Teal equalizer bars
    borderRadius: 2.5,
  },
  overlayTranscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(98, 250, 227, 0.2)',
    width: '90%',
  },
  overlayTranscriptionText: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: 13,
    color: '#62fae3', // Teal text
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Card slots inside Chat bubbles styles
  cardWrapper: {
    marginTop: 8,
    width: '100%',
  },
  cardLabel: {
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 6,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotBtn: {
    backgroundColor: Theme.colors.secondaryContainer,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
  },
  slotBtnText: {
    color: Theme.colors.secondary,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 11,
  },
  logoutBtn: {
    marginTop: 20,
    width: '100%',
    height: Theme.spacing.buttonHeight,
    backgroundColor: Theme.colors.lightGray,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  logoutBtnText: {
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
});
