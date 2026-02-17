// screens/LoginScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { login as apiLogin } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// ─── DESIGN TOKENS ───────────────────────────────────────────
const T = {
  // Backgrounds
  bg:        '#0E0E12',   // near black with blue undertone
  bgCard:    '#16161D',   // slightly lighter surface
  bgInput:   '#1E1E28',   // input background

  // Accent — indigo to violet gradient (expressed as flat colors for RN)
  accent:    '#6C63FF',   // indigo
  accentB:   '#A855F7',   // violet
  accentGlow:'rgba(108,99,255,0.18)',

  // Text
  textHi:    '#F2F2F7',   // primary text
  textMid:   '#8E8EA0',   // secondary / labels
  textLow:   '#3A3A4C',   // placeholder / disabled

  // State
  error:     '#FF6B6B',
  errorBg:   'rgba(255,107,107,0.10)',
  success:   '#34D399',

  // Borders
  border:    '#2A2A38',
  borderFocus:'#6C63FF',
};

export default function LoginScreen() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus,    setPwFocus]    = useState(false);

  // Entrance anims
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const card1Anim  = useRef(new Animated.Value(0)).current;
  const card2Anim  = useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  // Floating orb pulse
  const orbAnim  = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  // Button scale
  const btnScale = useRef(new Animated.Value(1)).current;
  const regScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user) { router.replace('/'); return; }

    // Staggered entrance
    Animated.stagger(80, [
      Animated.spring(logoAnim,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(titleAnim,  { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(card1Anim,  { toValue: 1, tension: 45, friction: 9, useNativeDriver: true }),
      Animated.spring(card2Anim,  { toValue: 1, tension: 45, friction: 9, useNativeDriver: true }),
      Animated.spring(btnAnim,    { toValue: 1, tension: 45, friction: 9, useNativeDriver: true }),
      Animated.spring(footerAnim, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }),
    ]).start();

    // Orb slow float
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim,  { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orbAnim,  { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Anim, { toValue: 1, duration: 5500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb2Anim, { toValue: 0, duration: 5500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [user]);

  useFocusEffect(useCallback(() => {
    setEmail(''); setPassword(''); setErrors({});
  }, []));

  function clearErr(k) { if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); }

  function validate() {
    const e = {};
    if (!email.trim())                     e.email = 'Please enter your email';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password.trim())                  e.pw    = 'Please enter your password';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function pIn(a)  { Animated.spring(a, { toValue: 0.95, useNativeDriver: true }).start(); }
  function pOut(a) { Animated.spring(a, { toValue: 1,    useNativeDriver: true }).start(); }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      if (!res?.data?.success) {
        Alert.alert('Login Failed', res?.data?.error || 'Invalid credentials');
        setLoading(false); return;
      }
      const u = res.data.user;
      await setUser({ id: u._id, name: u.name, email: u.email, token: u.token });
      router.replace('/');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  // Entrance helper
  const enter = (anim, dy = 24) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[dy,0] }) }],
  });

  // Orb float
  const orb1Y  = orbAnim.interpolate({ inputRange:[0,1], outputRange:[0, -18] });
  const orb2Y  = orb2Anim.interpolate({ inputRange:[0,1], outputRange:[0, 14] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={st.wrapper}
    >
      {/* ── BACKGROUND ORBS ── */}
      <Animated.View style={[st.orb1, { transform:[{ translateY: orb1Y }] }]} />
      <Animated.View style={[st.orb2, { transform:[{ translateY: orb2Y }] }]} />

      <ScrollView
        contentContainerStyle={st.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={st.container}>

          {/* ── LOGO MARK ── */}
          <Animated.View style={[st.logoWrap, enter(logoAnim, -16)]}>
            <View style={st.logoMark}>
              <View style={st.logoInner} />
            </View>
          </Animated.View>

          {/* ── HEADING ── */}
          <Animated.View style={[st.heading, enter(titleAnim, 20)]}>
            <Text style={st.titleHi}>Welcome back</Text>
            <Text style={st.titleSub}>Sign in to your account to continue</Text>
          </Animated.View>

          {/* ── EMAIL FIELD ── */}
          <Animated.View style={enter(card1Anim, 28)}>
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

          {/* ── PASSWORD FIELD ── */}
          <Animated.View style={enter(card2Anim, 32)}>
            <InputField
              label="Password"
              value={password}
              onChangeText={v => { setPassword(v); clearErr('pw'); }}
              placeholder="Enter your password"
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
              footer={
                <TouchableOpacity style={st.forgotWrap}>
                  <Text style={st.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              }
            />
          </Animated.View>

          {/* ── SIGN IN BUTTON ── */}
          <Animated.View style={[enter(btnAnim, 20), { marginTop: 8 }]}>
            <Animated.View style={{ transform:[{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[st.primaryBtn, loading && st.primaryBtnLoading]}
                onPress={handleLogin}
                onPressIn={() => pIn(btnScale)}
                onPressOut={() => pOut(btnScale)}
                disabled={loading}
                activeOpacity={1}
              >
                {/* Gradient shimmer overlay */}
                <View style={st.btnShimmer} />
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={st.primaryBtnText}>Sign In</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={st.divider}>
              <View style={st.divLine} />
              <Text style={st.divLabel}>or</Text>
              <View style={st.divLine} />
            </View>

            {/* Register */}
            <Animated.View style={{ transform:[{ scale: regScale }] }}>
              <TouchableOpacity
                style={st.secondaryBtn}
                onPress={() => router.push('/register')}
                onPressIn={() => pIn(regScale)}
                onPressOut={() => pOut(regScale)}
                disabled={loading}
                activeOpacity={1}
              >
                <Text style={st.secondaryBtnText}>Create an Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── FOOTER ── */}
          <Animated.Text style={[st.footer, enter(footerAnim, 12)]}>
            By continuing you agree to our{' '}
            <Text style={st.footerLink}>Terms</Text>
            {' '}and{' '}
            <Text style={st.footerLink}>Privacy Policy</Text>
          </Animated.Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── INPUT FIELD COMPONENT ────────────────────────────────────
function InputField({ label, value, onChangeText, placeholder, focused, onFocus, onBlur,
  editable, error, secureTextEntry, keyboardType, autoCapitalize, autoCorrect,
  rightAction, footer }) {

  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: focused ? 1 : 0,
      tension: 80, friction: 8, useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? T.error : T.border, error ? T.error : T.borderFocus],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [T.bgInput, error ? T.errorBg : '#1A1A2E'],
  });

  return (
    <View style={ip.group}>
      <Text style={[ip.label, focused && ip.labelFocused, !!error && ip.labelError]}>
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
        <View style={ip.errorRow}>
          <Text style={ip.errorDot}>●</Text>
          <Text style={ip.errorText}>{error}</Text>
        </View>
      )}
      {footer}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const st = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: T.bg },

  // Background orbs
  orb1: {
    position: 'absolute',
    top: height * 0.05,
    left: -width * 0.3,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: T.accent,
    opacity: 0.07,
  },
  orb2: {
    position: 'absolute',
    bottom: height * 0.1,
    right: -width * 0.25,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: T.accentB,
    opacity: 0.06,
  },

  scroll:    { flexGrow: 1, justifyContent: 'center', paddingVertical: 56 },
  container: { paddingHorizontal: 28 },

  // Logo mark — two overlapping squares
  logoWrap: { alignItems: 'flex-start', marginBottom: 36 },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: T.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.accent,
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
  heading:  { marginBottom: 36 },
  titleHi:  {
    fontSize: 34,
    fontWeight: '700',
    color: T.textHi,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  titleSub: {
    fontSize: 15,
    color: T.textMid,
    fontWeight: '400',
    lineHeight: 22,
  },

  // Eye button
  eyeBtn:  { padding: 4 },
  eyeIcon: { fontSize: 18, color: T.textMid },

  // Forgot
  forgotWrap: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { fontSize: 13, color: T.accent, fontWeight: '600' },

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
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine:  { flex: 1, height: 1, backgroundColor: T.border },
  divLabel: { fontSize: 13, color: T.textMid, marginHorizontal: 14, fontWeight: '500' },

  // Secondary button
  secondaryBtn: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: T.textHi,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Footer
  footer:     { marginTop: 36, fontSize: 12, color: T.textMid, textAlign: 'center', lineHeight: 20 },
  footerLink: { color: T.accent, fontWeight: '600' },
});

const ip = StyleSheet.create({
  group: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: T.textMid,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  labelFocused: { color: T.accent },
  labelError:   { color: T.error },
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
  rightSlot: {
    position: 'absolute',
    right: 16,
    top: 0, bottom: 0,
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 6,
  },
  errorDot:  { fontSize: 6,  color: T.error },
  errorText: { fontSize: 12, color: T.error, fontWeight: '500' },
});