// Redirection vers la route dans (tabs) pour avoir le layout avec les tabs
import { Redirect } from 'expo-router';

export default function AlertsRedirect() {
  return <Redirect href="/(tabs)/alerts" />;
}
