import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

import { getAppConfig } from "@/lib/config";

const settingsCookieName = "iot_dashboard_settings_unlock";

function getSettingsPin() {
  return getAppConfig().settingsPin.trim();
}

function getUnlockToken(pin: string) {
  return createHash("sha256")
    .update(`iot-dashboard-settings:${pin}`)
    .digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isSettingsPinConfigured() {
  return getSettingsPin().length > 0;
}

export async function isSettingsUnlocked() {
  const pin = getSettingsPin();

  if (!pin) {
    return false;
  }

  const cookieStore = await cookies();
  const unlockCookie = cookieStore.get(settingsCookieName);

  return unlockCookie
    ? safeCompare(unlockCookie.value, getUnlockToken(pin))
    : false;
}

export async function unlockSettings(pinAttempt: string) {
  const config = getAppConfig();
  const pin = config.settingsPin.trim();

  if (!pin || !safeCompare(pinAttempt, pin)) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(settingsCookieName, getUnlockToken(pin), {
    httpOnly: true,
    maxAge: 60 * 30,
    path: "/settings",
    sameSite: "strict",
    secure: config.settingsCookieSecure,
  });

  return true;
}

export async function lockSettings() {
  const cookieStore = await cookies();
  cookieStore.delete(settingsCookieName);
}

export async function requireSettingsUnlock() {
  if (!(await isSettingsUnlocked())) {
    throw new Error("Settings page is locked.");
  }
}
