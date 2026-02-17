// screens/RegisterScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { register as apiRegister } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// ─── DESIGN TOKENS (matches LoginScreen exactly) ───────────
const T = {
  bg:         '#0E0E12',
  bgCard:     '#16161D',
  bgInput:    '#1E1E28',
  accent:     '#6C63FF',
  accentB:    '#A855F7',
  accentGlow: 'rgba(108,99,255,0.18)',
  textHi:     '#F2F2F7',
  textMid:    '#8E8EA0',
  textLow:    '#3A3A4C',
  error:      '#FF6B6B',
  errorBg:    'rgba(255,107,107,0.10)',
  success:    '#34D399',
  border:     '#2A2A38',
  borderFocus:'#6C63FF',
};

// Strength config
const STRENGTH = [
  { label: '',       color: T.textLow  },
  { label: 'Weak',   color: '#FF6B6B'  },
  { label: 'Fair',   color: '#FBBF24'  },
  { label: 'Good',   color: '#34D399'  },
  { label: 'Strong', color: '#6C63FF'  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useUser();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [showCpw,  setShowCpw]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [strength, setStrength] = useState(0);

  const [nameFocus,  setNameFocus]  = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus,    setPwFocus]    = useState(false);
  const [cpwFocus,   setCpwFocus]   = useState(false);

  // Entrance
  const backAnim   = useRef(new Animated.Value(0)).current;
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const fields1Anim= useRef(new Animated.Value(0)).current;
  const fields2Anim= useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  // Orbs
  const orbAnim  = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  // Strength bar
  const strengthAnim = useRef(new Animated.Value(0)).current;

  // Button scale
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.spring(backAnim,   { toValue:1, tension:55, friction:9, useNativeDriver:true }),
      Animated.spring(logoAnim,   { toValue:1, tension:50, friction:8, useNativeDriver:true }),
      Animated.spring(titleAnim,  { toValue:1, tension:50, friction:8, useNativeDriver:true }),
      Animated.spring(fields1Anim,{ toValue:1, tension:45, friction:9, useNativeDriver:true }),
      Animated.spring(fields2Anim,{ toValue:1, tension:45, friction:9, useNativeDriver:true }),
      Animated.spring(btnAnim,    { toValue:1, tension:45, friction:9, useNativeDriver:true }),
      Animated.spring(footerAnim, { toValue:1, tension:40, friction:9, useNativeDriver:true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(orbAnim,  { toValue:1, duration:4500, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      Animated.timing(orbAnim,  { toValue:0, duration:4500, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(orb2Anim, { toValue:1, duration:5800, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      Animated.timing(orb2Anim, { toValue:0, duration:5800, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
    ])).start();
  }, []);

  useFocusEffect(useCallback(() => {
    setName(''); setEmail(''); setPassword(''); setConfirm(''); setErrors({});
  }, []));

  // Password strength
  useEffect(() => {
    if (!password) { setStrength(0); Animated.spring(strengthAnim, { toValue:0, useNativeDriver:false }).start(); return; }
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    const level = password.length < 6 ? 1 : Math.max(1, s);
    setStrength(level);
    Animated.spring(strengthAnim, {
      toValue: level / 4,
      tension: 60, friction: 8, useNativeDriver: false,
    }).start();
  }, [password]);

  function clearErr(k) { if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); }

  function validate() {
    const e = {};
    if (!name.trim())                        e.name  = 'Please enter your full name';
    if (!email.trim())                       e.email = 'Please enter your email';
    else if (!/\S+@\S+\.\S+/.test(email))   e.email = 'Enter a valid email address';
    if (password.length < 6)                 e.pw    = 'Password must be at least 6 characters';
    if (password !== confirm)                e.cpw   = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function pIn()  { Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start(); }
  function pOut() { Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start(); }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiRegister({ name, email, password });
      if (!res?.data?.success) {
        Alert.alert('Registration Failed', res?.data?.error || 'Unable to create account.');
        setLoading(false); return;
      }
      Alert.alert('Account Created!', 'Please sign in with your new credentials.');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  const enter = (anim, dy = 24) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[dy,0] }) }],
  });

  const orb1Y = orbAnim.interpolate({ inputRange:[0,1], outputRange:[0, -18] });
  const orb2Y = orb2Anim.interpolate({ inputRange:[0,1], outputRange:[0,  14] });

  const sl = STRENGTH[strength] ?? STRENGTH[0];
  const confirmsMatch = confirm.length > 0 && password === confirm;

  const rules = [
    { met: password.length >= 8,           label: '8+ characters' },
    { met: /[A-Z]/.test(password),         label: 'Uppercase letter' },
    { met: /[0-9]/.test(password),         label: 'Number' },
    { met: /[^A-Za-z0-9]/.test(password),  label: 'Special character' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={st.wrapper}
    >
      {/* Background orbs */}
      <Animated.View style={[st.orb1, { transform:[{ translateY: orb1Y }] }]} />
      <Animated.View style={[st.orb2, { transform:[{ translateY: orb2Y }] }]} />

      <ScrollView
        contentContainerStyle={st.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={st.container}>

          {/* Back button */}
          <Animated.View style={enter(backAnim, -12)}>
            <TouchableOpacity
              style={st.backBtn}
              onPress={() => router.back()}
              disabled={loading}
              hitSlop={{ top:10, bottom:10, left:10, right:24 }}
            >
              <View style={st.backArrowBox}>
                <Text style={st.backArrow}>←</Text>
              </View>
              <Text style={st.backLabel}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Logo mark */}
          <Animated.View style={[st.logoWrap, enter(logoAnim, -12)]}>
            <View style={st.logoMark}>
              <View style={st.logoInner} />
            </View>
          </Animated.View>

          {/* Heading */}
          <Animated.View style={[st.heading, enter(titleAnim, 20)]}>
            <Text style={st.titleHi}>Create account</Text>
            <Text style={st.titleSub}>Join us — it only takes a minute</Text>
          </Animated.View>

          {/* Name + Email */}
          <Animated.View style={enter(fields1Anim, 28)}>
            <InputField
              label="Full Name"
              value={name}
              onChangeText={v => { setName(v); clearErr('name'); }}
              placeholder="Enter your full name"
              autoCapitalize="words"
              focused={nameFocus}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
              editable={!loading}
              error={errors.name}
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={v => { setEmail(v); clearErr('email'); }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              focused={emailFocus}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              editable={!loading}
              error={errors.email}
            />
          </Animated.View>

          {/* Password + Confirm */}
          <Animated.View style={enter(fields2Anim, 32)}>
            <InputField
              label="Password"
              value={password}
              onChangeText={v => { setPassword(v); clearErr('pw'); }}
              placeholder="Min. 6 characters"
              secureTextEntry={!showPw}
              focused={pwFocus}
              onFocus={() => setPwFocus(true)}
              onBlur={() => setPwFocus(false)}
              editable={!loading}
              error={errors.pw}
              rightAction={
                <TouchableOpacity onPress={() => setShowPw(x => !x)} style={st.eyeBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Text style={st.eyeIcon}>{showPw ? '◉' : '◎'}</Text>
                </TouchableOpacity>
              }
              footer={password.length > 0 && (
                <View style={st.strengthBlock}>
                  {/* Bar + label row */}
                  <View style={st.strengthRow}>
                    <View style={st.strengthTrack}>
                      <Animated.View style={[
                        st.strengthFill,
                        {
                          width: strengthAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
                          backgroundColor: sl.color,
                        },
                      ]} />
                    </View>
                    {!!sl.label && (
                      <Text style={[st.strengthLabel, { color: sl.color }]}>{sl.label}</Text>
                    )}
                  </View>
                  {/* Pill rules */}
                  <View style={st.ruleRow}>
                    {rules.map(r => (
                      <View key={r.label} style={[st.rulePill, r.met && st.rulePillMet]}>
                        <Text style={[st.rulePillText, r.met && st.rulePillTextMet]}>
                          {r.met ? '✓ ' : ''}{r.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            />

            <InputField
              label="Confirm Password"
              value={confirm}
              onChangeText={v => { setConfirm(v); clearErr('cpw'); }}
              placeholder="Re-enter your password"
              secureTextEntry={!showCpw}
              focused={cpwFocus}
              onFocus={() => setCpwFocus(true)}
              onBlur={() => setCpwFocus(false)}
              editable={!loading}
              error={errors.cpw}
              successText={confirmsMatch ? 'Passwords match' : undefined}
              overrideSuccess={confirmsMatch}
              rightAction={
                <TouchableOpacity onPress={() => setShowCpw(x => !x)} style={st.eyeBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Text style={st.eyeIcon}>{showCpw ? '◉' : '◎'}</Text>
                </TouchableOpacity>
              }
            />
          </Animated.View>

          {/* CTA */}
          <Animated.View style={[enter(btnAnim, 20), { marginTop: 8 }]}>
            <Animated.View style={{ transform:[{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[st.primaryBtn, loading && st.primaryBtnLoading]}
                onPress={handleRegister}
                onPressIn={pIn}
                onPressOut={pOut}
                disabled={loading}
                activeOpacity={1}
              >
                <View style={st.btnShimmer} />
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={st.primaryBtnText}>Create Account</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            <View style={st.signInRow}>
              <Text style={st.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <Text style={st.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.Text style={[st.footer, enter(footerAnim, 12)]}>
            By creating an account you agree to our{' '}
            <Text style={st.footerLink}>Terms</Text>
            {' '}and{' '}
            <Text style={st.footerLink}>Privacy Policy</Text>
          </Animated.Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── SHARED INPUT FIELD ───────────────────────────────────────
function InputField({ label, value, onChangeText, placeholder, focused, onFocus, onBlur,
  editable, error, secureTextEntry, keyboardType, autoCapitalize, autoCorrect,
  rightAction, footer, successText, overrideSuccess }) {

  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: focused ? 1 : 0,
      tension: 80, friction: 8, useNativeDriver: false,
    }).start();
  }, [focused]);

  const hasBorderOverride = error || overrideSuccess;
  const borderColor = hasBorderOverride
    ? (error ? T.error : T.success)
    : focusAnim.interpolate({ inputRange:[0,1], outputRange:[T.border, T.borderFocus] });

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [T.bgInput, error ? T.errorBg : '#1A1A2E'],
  });

  return (
    <View style={ip.group}>
      <Text style={[ip.label, focused && ip.labelFocused, !!error && ip.labelError, overrideSuccess && ip.labelSuccess]}>
        {label}
      </Text>
      <Animated.View style={[ip.box, { borderColor, backgroundColor: bgColor }]}>
        <TextInput
          style={[ip.input, rightAction && { paddingRight: 48 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.textLow}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={editable}
          selectionColor={T.accent}
        />
        {rightAction && <View style={ip.rightSlot}>{rightAction}</View>}
      </Animated.View>
      {!!error && (
        <View style={ip.feedbackRow}>
          <Text style={ip.errorDot}>●</Text>
          <Text style={ip.errorText}>{error}</Text>
        </View>
      )}
      {!error && successText && (
        <View style={ip.feedbackRow}>
          <Text style={[ip.errorDot, { color: T.success }]}>✓</Text>
          <Text style={[ip.errorText, { color: T.success }]}>{successText}</Text>
        </View>
      )}
      {footer}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const st = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: T.bg },

  orb1: {
    position: 'absolute',
    top: height * 0.05,
    right: -width * 0.25,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: T.accentB,
    opacity: 0.06,
  },
  orb2: {
    position: 'absolute',
    bottom: height * 0.08,
    left: -width * 0.3,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: T.accent,
    opacity: 0.06,
  },

  scroll:    { flexGrow: 1, paddingVertical: 44 },
  container: { paddingHorizontal: 28 },

  // Back
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  backArrowBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { fontSize: 16, color: T.textHi, lineHeight: 20 },
  backLabel: { fontSize: 15, color: T.textMid, fontWeight: '500' },

  // Logo
  logoWrap: { marginBottom: 28 },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: T.accentB,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.accentB,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Heading
  heading:  { marginBottom: 32 },
  titleHi:  { fontSize: 32, fontWeight: '700', color: T.textHi, letterSpacing: -0.7, marginBottom: 8 },
  titleSub: { fontSize: 15, color: T.textMid, fontWeight: '400', lineHeight: 22 },

  eyeBtn:  { padding: 4 },
  eyeIcon: { fontSize: 18, color: T.textMid },

  // Strength
  strengthBlock: { marginTop: 12, gap: 10 },
  strengthRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthTrack: { flex: 1, height: 4, backgroundColor: T.border, borderRadius: 2, overflow: 'hidden' },
  strengthFill:  { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 52, textAlign: 'right' },

  ruleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rulePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.bgCard,
  },
  rulePillMet: {
    borderColor: T.accent,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  rulePillText:    { fontSize: 11, color: T.textLow, fontWeight: '500' },
  rulePillTextMet: { color: T.accent },

  // Primary button
  primaryBtn: {
    height: 58,
    borderRadius: 16,
    backgroundColor: T.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryBtnLoading: { opacity: 0.7 },
  btnShimmer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  signInRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  signInText: { fontSize: 14, color: T.textMid },
  signInLink: { fontSize: 14, color: T.accent, fontWeight: '600' },

  footer:     { marginTop: 32, fontSize: 12, color: T.textMid, textAlign: 'center', lineHeight: 20 },
  footerLink: { color: T.accent, fontWeight: '600' },
});

const ip = StyleSheet.create({
  group: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: T.textMid, marginBottom: 8, letterSpacing: 0.2 },
  labelFocused: { color: T.accent },
  labelError:   { color: T.error },
  labelSuccess: { color: T.success },
  box: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: T.textHi,
    paddingVertical: 0,
    fontWeight: '400',
  },
  rightSlot: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 6 },
  errorDot:    { fontSize: 6,  color: T.error },
  errorText:   { fontSize: 12, color: T.error, fontWeight: '500' },
});