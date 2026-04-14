export type VehiclesStackParamList = {
  VehicleList: undefined;
  VehicleDetail: { vehicleId: string };
  VehicleForm: { vehicleId?: string };
  FuelLogForm: { vehicleId: string };
  ServiceForm: { vehicleId: string };
};

export type RootTabParamList = {
  VehiclesTab: undefined;
  SettingsTab: undefined;
};
