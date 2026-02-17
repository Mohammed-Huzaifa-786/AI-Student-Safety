import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  Alert, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Dimensions,
  ScrollView,
  Modal
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function EmergencyContactsScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (showForm) {
      Animated.spring(formSlideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(formSlideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showForm]);

  useFocusEffect(
    React.useCallback(() => {
      fetchContacts();
    }, [])
  );

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await getEmergencyContacts();
      const fetched = res.data?.contacts || [];
      console.log('fetchContacts -> count', fetched.length);
      setContacts(fetched);
    } catch (e) {
      console.error('fetchContacts error', e?.response || e?.message || e);
      const msg = e?.response?.data?.error || e?.message || 'Unable to load contacts.';
      Alert.alert('Unable to load contacts', msg);
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Accept common formats:
    // - 3-digit authority numbers (e.g., 100, 108)
    // - 10-digit local numbers
    // - country-coded numbers like 91xxxxxxxxxx
    // - international numbers up to 15 digits
    if (cleaned.length === 3) return true;
    if (cleaned.length === 10) return true;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return true;
    if (cleaned.length > 10 && cleaned.length <= 15) return true;
    return false;
  };

  const formatPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // authority short numbers
    if (cleaned.length === 3) return cleaned;
    // If 10-digit local, format as (+91) xxxxxxxxxx
    if (cleaned.length === 10) return `(+91) ${cleaned}`;
    // If already includes country code (e.g., 91xxxxxxxxxx), strip leading 91 and format
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `(+91) ${cleaned.slice(2)}`;
    // fallback: show raw
    return phoneNumber;
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a contact name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Phone Required', 'Please enter a phone number.');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (10-15 digits).');
      return;
    }

    setAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Normalize phone for backend storage:
      // - keep 3-digit authority numbers as-is (e.g., 100)
      // - convert 10-digit local numbers to +91xxxxxxxxxx
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) cleaned = '91' + cleaned;
      const normalized = cleaned.length === 3 ? cleaned : `+${cleaned}`;
      const res = await addEmergencyContact({ name: name.trim(), phone: normalized });
      console.log('addEmergencyContact response', res?.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✓ Contact Added', `${name.trim()} will be notified during emergencies.`);
      setName('');
      setPhone('');
      await fetchContacts();
      setShowForm(false);
    } catch (e) {
      console.error('add contact error', e?.response || e?.message || e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.response?.data?.error || e?.message || 'Unable to add contact.';
      Alert.alert('Failed', msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (contact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name}? They will no longer receive alerts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setDeletingId(contact._id);
              const res = await deleteEmergencyContact(contact._id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await fetchContacts();
              Alert.alert('Removed', `${contact.name} was removed.`);
              setDeletingId(null);
            } catch (e) {
              console.error('delete error', e?.response || e?.message || e);
              const msg = e?.response?.data?.error || 'Failed to remove contact';
              Alert.alert('Error', msg);
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const handleCall = (contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${contact.phone}`);
  };

  const ContactItem = ({ item, index }) => {
    const cardAnimRef = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnimRef, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    }, []);

    console.log('render ContactItem', item?.name);
    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardAnimRef,
            transform: [
              {
                translateY: cardAnimRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
          <View style={styles.cardContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{formatPhoneNumber(item.phone)}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item)} disabled={deletingId === item._id}>
              <Text style={styles.btnIcon}>📞</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} disabled={deletingId === item._id}>
              {deletingId === item._id ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnIcon}>🗑️</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderContact = ({ item, index }) => <ContactItem item={item} index={index} />;

  const renderEmpty = () => (
    <Animated.View style={[styles.empty, { opacity: fadeAnim }]}>
      <View style={styles.emptyCircle}>
        <Text style={styles.emptyIcon}>📋</Text>
      </View>
      <Text style={styles.emptyTitle}>No Contacts Yet</Text>
      <Text style={styles.emptyText}>
        Add trusted people who will be notified with your location during emergencies
      </Text>
      <View style={styles.emptyHint}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={styles.hintText}>Tap the green button above to add your first contact</Text>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
      style={styles.wrapper}
    >
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerIconBox}>
              <Text style={styles.headerIcon}>📞</Text>
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Emergency Contacts</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.subtitle}>
                  {contacts.length > 0 
                    ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} active`
                    : 'No contacts added'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Add Button */}
          <TouchableOpacity 
            style={styles.addFloatingBtn} 
            onPress={() => setShowForm(!showForm)}
            activeOpacity={0.8}
          >
            <Animated.Text 
              style={[
                styles.addFloatingIcon,
                {
                  transform: [{
                    rotate: showForm ? '45deg' : '0deg'
                  }]
                }
              ]}
            >
              +
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Add Contact Modal Form */}
        <Modal
          visible={showForm}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowForm(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={styles.modalBackdropTouchable} activeOpacity={1} onPress={() => setShowForm(false)} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
              style={styles.modalContainer}
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.form}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Add New Contact</Text>
                    <Text style={styles.formSubtitle}>They'll receive emergency alerts with your location</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={[styles.inputBox, nameFocused && styles.inputFocused]}>
                      <Text style={styles.inputIcon}>👤</Text>
                      <TextInput
                        placeholder="e.g., John Doe"
                        placeholderTextColor="#6B7280"
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                        autoCapitalize="words"
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        editable={!adding}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={[styles.inputBox, phoneFocused && styles.inputFocused]}>
                      <Text style={styles.inputIcon}>📱</Text>
                      <TextInput
                        placeholder="e.g., 100 or 9876543210"
                        placeholderTextColor="#6B7280"
                        value={phone}
                        onChangeText={setPhone}
                        style={styles.input}
                        keyboardType="phone-pad"
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        editable={!adding}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, adding && styles.submitBtnDisabled]}
                    onPress={handleAdd}
                    disabled={adding}
                    activeOpacity={0.8}
                  >
                    {adding ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.submitBtnText}>Add Contact</Text>
                        <Text style={styles.submitBtnArrow}>→</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Contacts List */}
        <View style={styles.listWrapper}>
          {contacts.length > 0 && (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Your Contacts</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{contacts.length}</Text>
              </View>
            </View>
          )}

          {loading && contacts.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => String(item._id)}
              renderItem={renderContact}
              refreshing={loading}
              onRefresh={fetchContacts}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#111827' },
  container: { flex: 1, backgroundColor: '#111827' },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIcon: { fontSize: 32 },
  headerContent: { flex: 1 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  subtitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  
  // Floating Add Button
  addFloatingBtn: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addFloatingIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
    lineHeight: 32,
  },

  // Form
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    position: 'absolute',
    left: 20,
    right: 20,
    top: 120,
    zIndex: 20,
    // limit height so ScrollView can scroll when keyboard is open
    maxHeight: height * 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: { flex: 1 },
  modalContainer: {
    maxHeight: height * 0.78,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  form: {
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  formHeader: { marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  formSubtitle: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  inputFocused: { 
    borderColor: '#3B82F6',
    backgroundColor: '#1F2937',
  },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#FFF', paddingVertical: 0 },

  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  submitBtnArrow: { color: '#FFF', fontSize: 18, fontWeight: '600' },

  // List
  listWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  countBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  listContent: { paddingBottom: 20 },

  // Contact Card
  card: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  info: { flex: 1, minWidth: 140 },
  name: { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  phone: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actions: { flexDirection: 'row', marginLeft: 12, flexShrink: 0, alignItems: 'center' },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  btnIcon: { fontSize: 20 },

  // Empty State
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  hintIcon: { fontSize: 20, marginRight: 10 },
  hintText: { flex: 1, fontSize: 13, color: '#D1D5DB', lineHeight: 18 },

  // Loading
  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#9CA3AF' },
});