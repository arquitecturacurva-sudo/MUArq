export const runLockedBrandMutation = async <Result>(
  onBusyChange: (busy: boolean) => void,
  mutation: () => Promise<Result>
): Promise<Result> => {
  onBusyChange(true);
  try {
    return await mutation();
  } finally {
    onBusyChange(false);
  }
};
