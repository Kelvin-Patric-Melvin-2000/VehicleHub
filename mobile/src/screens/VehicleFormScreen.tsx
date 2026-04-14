import { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, Alert, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { VehiclesStackParamList } from "@/navigation/types";
import { getDb } from "@/db/client";
import { createVehicle, getVehicle, updateVehicle } from "@/repos/vehicles";
import { Screen, Title, Field, PrimaryButton } from "@/components/ui";
import { useRefresh } from "@/store/refresh";
import { space } from "@/theme";

type Props = NativeStackScreenProps<VehiclesStackParamList, "VehicleForm">;

export function VehicleFormScreen({ navigation, route }: Props) {
  const vehicleId = route.params?.vehicleId;
  const isEdit = Boolean(vehicleId);

  const [name, setName] = useState("");
  const [type, setType] = useState("motorcycle");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [reg, setReg] = useState("");
  const [mileage, setMileage] = useState("0");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? "Edit vehicle" : "Add vehicle" });
  }, [navigation, isEdit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isEdit || !vehicleId) return;
      const v = await getVehicle(getDb(), vehicleId);
      if (cancelled || !v) return;
      setName(v.name);
      setType(v.type);
      setMake(v.make ?? "");
      setModel(v.model ?? "");
      setYear(v.year != null ? String(v.year) : "");
      setReg(v.registration_number ?? "");
      setMileage(String(v.current_mileage));
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, vehicleId]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }
    const y = year.trim() === "" ? null : Number(year.trim());
    if (year.trim() !== "" && (typeof y !== "number" || Number.isNaN(y))) {
      Alert.alert("Validation", "Year must be a number.");
      return;
    }
    const m = Number(mileage);
    if (Number.isNaN(m) || m < 0) {
      Alert.alert("Validation", "Odometer must be a non-negative number.");
      return;
    }
    setLoading(true);
    try {
      const db = getDb();
      if (isEdit && vehicleId) {
        await updateVehicle(db, vehicleId, {
          name,
          type,
          make: make || null,
          model: model || null,
          year: y,
          registration_number: reg || null,
          current_mileage: m,
        });
        useRefresh.getState().bump();
        navigation.navigate("VehicleDetail", { vehicleId });
      } else {
        const v = await createVehicle(db, {
          name,
          type,
          make: make || null,
          model: model || null,
          year: y,
          registration_number: reg || null,
          current_mileage: m,
        });
        useRefresh.getState().bump();
        navigation.replace("VehicleDetail", { vehicleId: v.id });
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <Title>{isEdit ? "Edit" : "New vehicle"}</Title>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="e.g. Daily commuter" />
        <Field label="Type" value={type} onChangeText={setType} placeholder="motorcycle, car, …" />
        <Field label="Make" value={make} onChangeText={setMake} />
        <Field label="Model" value={model} onChangeText={setModel} />
        <Field label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
        <Field label="Registration" value={reg} onChangeText={setReg} autoCapitalize="characters" />
        <Field label="Current odometer (km)" value={mileage} onChangeText={setMileage} keyboardType="decimal-pad" />
        <PrimaryButton title="Save" onPress={() => void onSave()} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.xl,
  },
});
