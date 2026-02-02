// ============================================
// Preventis - Modal d'alerte custom
// Compatible Web, iOS et Android
// ============================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';

// =====================
// Types
// =====================

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    destructive?: boolean
  ) => void;
  showInfo: (title: string, message?: string) => void;
}

// =====================
// Context
// =====================

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  const show = useCallback((newConfig: AlertConfig) => {
    setConfig(newConfig);
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const hide = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
      callback?.();
    });
  }, [fadeAnim, scaleAnim]);

  const showAlert = useCallback((alertConfig: AlertConfig) => {
    show(alertConfig);
  }, [show]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmer',
    destructive: boolean = false
  ) => {
    show({
      title,
      message,
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        { text: confirmText, onPress: onConfirm, style: destructive ? 'destructive' : 'default' },
      ],
    });
  }, [show]);

  const showInfo = useCallback((title: string, message?: string) => {
    show({
      title,
      message,
      buttons: [{ text: 'OK' }],
    });
  }, [show]);

  const handleButtonPress = (button: AlertButton) => {
    hide(button.onPress);
  };

  const buttons = config?.buttons || [{ text: 'OK' }];

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showInfo }}>
      {children}
      
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => hide()}
      >
        <Pressable 
          style={styles.overlayContainer}
          onPress={() => hide()}
        >
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View 
                style={[
                  styles.modal,
                  { 
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* Titre */}
                <Text style={styles.title}>{config?.title}</Text>
                
                {/* Message */}
                {config?.message && (
                  <Text style={styles.message}>{config.message}</Text>
                )}
                
                {/* Boutons */}
                <View style={[
                  styles.buttonsContainer,
                  buttons.length === 2 && styles.buttonsRow,
                ]}>
                  {buttons.map((button, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.button,
                        buttons.length === 2 && styles.buttonHalf,
                        button.style === 'cancel' && styles.buttonCancel,
                        button.style === 'destructive' && styles.buttonDestructive,
                        button.style === 'default' && styles.buttonDefault,
                        !button.style && index === buttons.length - 1 && styles.buttonDefault,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => handleButtonPress(button)}
                    >
                      <Text style={[
                        styles.buttonText,
                        button.style === 'cancel' && styles.buttonTextCancel,
                        button.style === 'destructive' && styles.buttonTextDestructive,
                        (button.style === 'default' || (!button.style && index === buttons.length - 1)) && styles.buttonTextDefault,
                      ]}>
                        {button.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

// =====================
// Hook
// =====================

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

// =====================
// Styles
// =====================

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonCancel: {
    backgroundColor: colors.backgroundTertiary,
  },
  buttonDefault: {
    backgroundColor: colors.primary,
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: colors.textPrimary,
  },
  buttonTextDefault: {
    color: '#FFFFFF',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
