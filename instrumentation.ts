export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { installNetworkOverrides } = await import("@/lib/pin");
  await installNetworkOverrides();
}
