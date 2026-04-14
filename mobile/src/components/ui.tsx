import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInputProps,
  TextInput,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, shadowCard, space } from "@/theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      {children}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode } & TextProps) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function EmptyState({
  icon = "car-outline",
  message,
}: {
  icon?: IoniconName;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={40} color={colors.muted} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type VehicleListRowProps = {
  title: string;
  subtitle: string;
  archived?: boolean;
  onPress: () => void;
};

export function VehicleListRow({ title, subtitle, archived, onPress }: VehicleListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listRowWrap, pressed && styles.listRowPressed]}
      android_ripple={{ color: "rgba(56, 189, 248, 0.15)" }}
    >
      <View style={styles.cardInner}>
        <View style={styles.listRowContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>{title}</Text>
            <Text style={styles.listSub}>{subtitle}</Text>
            {archived ? <Text style={styles.archivedBadge}>Archived</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btnPrimary,
        inactive && styles.btnDisabled,
        !inactive && pressed && styles.btnPrimaryPressed,
      ]}
      onPress={onPress}
      disabled={inactive}
      android_ripple={{ color: "rgba(15, 23, 42, 0.25)" }}
    >
      {loading ? (
        <ActivityIndicator color={colors.bg} />
      ) : (
        <Text style={styles.btnPrimaryText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
      onPress={onPress}
      android_ripple={{ color: "rgba(148, 163, 184, 0.2)" }}
    >
      <Text style={styles.btnSecondaryText}>{title}</Text>
    </Pressable>
  );
}

export function DangerButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btnDanger, pressed && styles.btnDangerPressed]}
      onPress={onPress}
      android_ripple={{ color: "rgba(248, 113, 113, 0.2)" }}
    >
      <Text style={styles.btnDangerText}>{title}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  title: {
    color: colors.text,
    fontSize: font.size.title,
    fontWeight: font.weight.bold,
    marginBottom: space.sm,
    letterSpacing: -0.3,
  },
  muted: {
    color: colors.muted,
    fontSize: font.size.caption,
    lineHeight: 20,
    marginBottom: space.md,
  },
  sectionHeader: {
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.size.body,
    fontWeight: font.weight.bold,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: font.size.label,
    marginTop: space.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: space.xl * 2,
    paddingHorizontal: space.lg,
  },
  emptyIcon: {
    marginBottom: space.md,
    opacity: 0.85,
  },
  emptyText: {
    color: colors.muted,
    fontSize: font.size.caption,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md + 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: space.sm + 2,
    ...shadowCard,
  },
  listRowWrap: {
    marginBottom: space.sm + 2,
    borderRadius: radius.md,
    ...shadowCard,
  },
  listRowPressed: {
    opacity: 0.92,
  },
  cardInner: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  listRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
  },
  listTitle: {
    color: colors.text,
    fontSize: font.size.headline,
    fontWeight: font.weight.bold,
  },
  listSub: {
    color: colors.muted,
    marginTop: space.xs,
    fontSize: font.size.caption,
  },
  archivedBadge: {
    color: colors.muted,
    marginTop: space.xs,
    fontSize: font.size.label,
    fontStyle: "italic",
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: space.sm,
  },
  btnPrimaryPressed: {
    opacity: 0.88,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: colors.bg, fontWeight: font.weight.bold, fontSize: font.size.body },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: space.sm,
    backgroundColor: "transparent",
  },
  btnSecondaryPressed: {
    backgroundColor: "rgba(148, 163, 184, 0.08)",
  },
  btnSecondaryText: { color: colors.text, fontWeight: font.weight.semibold, fontSize: font.size.body },
  btnDanger: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: space.sm,
    backgroundColor: "transparent",
  },
  btnDangerPressed: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  btnDangerText: { color: colors.danger, fontWeight: font.weight.semibold, fontSize: font.size.body },
  field: { marginBottom: space.md },
  label: {
    color: colors.muted,
    marginBottom: space.xs,
    fontSize: font.size.label,
    fontWeight: font.weight.medium,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: font.size.body,
  },
});
