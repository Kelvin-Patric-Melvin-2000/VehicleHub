import { useState } from "react";
import { Alert, ScrollView, Switch, Text, StyleSheet, View } from "react-native";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Screen, Title, Muted, PrimaryButton, SecondaryButton, Card } from "@/components/ui";
import { colors, font, space } from "@/theme";
import { useUiSettings } from "@/store/uiSettings";
import { writeBackupToCacheFile, importBackupFromJsonString } from "@/services/backup";
import { useRefresh } from "@/store/refresh";
import { rescheduleAllServiceNotifications } from "@/services/notifications";

export function SettingsScreen() {
  const showArchived = useUiSettings((s) => s.showArchived);
  const setShowArchived = useUiSettings((s) => s.setShowArchived);
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    try {
      const path = await writeBackupToCacheFile();
      const can = await Sharing.isAvailableAsync();
      if (!can) {
        Alert.alert("Sharing unavailable", `Backup written to:\n${path}`);
        return;
      }
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "VehicleHub backup",
        UTI: "public.json",
      });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onImport = () => {
    Alert.alert(
      "Import backup?",
      "This replaces all vehicles, fuel logs, and service records on this device with the backup file.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace data",
          style: "destructive",
          onPress: () => void pickAndImport(),
        },
      ],
    );
  };

  const pickAndImport = async () => {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      const text = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
      await importBackupFromJsonString(text);
      await rescheduleAllServiceNotifications();
      useRefresh.getState().bump();
      Alert.alert("Imported", "Your data was restored.");
    } catch (e) {
      Alert.alert("Import failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Title>Settings</Title>
        <Muted>100% offline — data stays in SQLite on this phone.</Muted>

        <Card style={styles.settingsCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Show archived vehicles</Text>
            <Switch
              value={showArchived}
              onValueChange={setShowArchived}
              trackColor={{ false: colors.border, true: colors.accentMuted }}
              thumbColor={showArchived ? colors.accent : colors.muted}
            />
          </View>
        </Card>

        <PrimaryButton title="Export backup (JSON)" onPress={() => void onExport()} loading={busy} disabled={busy} />
        <SecondaryButton title="Import backup (JSON)…" onPress={onImport} />

        <Muted style={styles.notice}>
          Local notifications fire at 09:00 on the &quot;next service date&quot; you set on a service record. Mileage-based
          reminders are shown on vehicle screens only.
        </Muted>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.xl,
  },
  settingsCard: {
    marginBottom: space.md,
    paddingVertical: space.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.xs,
  },
  switchLabel: {
    color: colors.text,
    fontSize: font.size.body,
    flex: 1,
    paddingRight: space.md,
    fontWeight: font.weight.medium,
  },
  notice: {
    marginTop: space.lg,
  },
});
