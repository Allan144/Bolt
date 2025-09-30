import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const initializeCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Default });
    await StatusBar.setBackgroundColor({ color: '#3B82F6' });
    
    // Hide splash screen
    await SplashScreen.hide();
    
    // Request notification permissions
    await LocalNotifications.requestPermissions();
  }
};

export const scheduleNotification = async (
  title: string,
  body: string,
  scheduledTime: Date,
  id: number
) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notifications only work on native platforms');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: scheduledTime },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: null
        }
      ]
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export const cancelNotification = async (id: number) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: id.toString() }]
    });
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const impactStyle = style === 'light' ? ImpactStyle.Light : 
                      style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Error triggering haptic:', error);
  }
};

export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();