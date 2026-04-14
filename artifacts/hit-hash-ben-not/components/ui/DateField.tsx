import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export interface CalendarEventSuggestion {
  date: string;
  title: string;
  location?: string | null;
}

interface InternalCalendarEvent {
  id: string;
  title: string;
  location?: string | null;
  startDate: string | Date;
}

interface DateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onEventSelect?: (event: CalendarEventSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

function formatDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  if (!iso) return new Date();
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return new Date();
  return d;
}

async function ensureCalendarPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Calendar.getCalendarPermissionsAsync();
    if (existing === "granted") return true;
    if (existing === "denied") return false;
    const { status: requested } = await Calendar.requestCalendarPermissionsAsync();
    return requested === "granted";
  } catch {
    return false;
  }
}

async function fetchEventsForDate(date: Date): Promise<InternalCalendarEvent[]> {
  if (Platform.OS === "web") return [];
  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars.map((c) => c.id);
    if (calendarIds.length === 0) return [];

    const events = await Calendar.getEventsAsync(calendarIds, start, end);
    return events.slice(0, 5).map((e) => ({
      id: e.id,
      title: e.title || "Untitled Event",
      location: e.location ?? null,
      startDate: e.startDate,
    }));
  } catch {
    return [];
  }
}

const CAL_CELL_WIDTH = `${100 / 7}%`;

export function DateField({
  label,
  value,
  onChange,
  onEventSelect,
  placeholder = "Select date",
  required,
  error,
}: DateFieldProps) {
  const colors = useColors();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parseIso(value));
  const [calendarEvents, setCalendarEvents] = useState<InternalCalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const openPicker = useCallback(() => {
    setTempDate(parseIso(value));
    setCalendarEvents([]);
    setPickerOpen(true);
  }, [value]);

  const handleAndroidChange = useCallback(
    async (event: DateTimePickerEvent, selected?: Date) => {
      setPickerOpen(false);
      if (event.type === "set" && selected) {
        const iso = isoFromDate(selected);
        onChange(iso);
        await handleDateSelected(selected);
      }
    },
    [onChange]
  );

  const handleIosChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (selected) {
        setTempDate(selected);
      }
    },
    []
  );

  const confirmIos = useCallback(async () => {
    setPickerOpen(false);
    const iso = isoFromDate(tempDate);
    onChange(iso);
    await handleDateSelected(tempDate);
  }, [tempDate, onChange]);

  const cancelPicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const handleDateSelected = useCallback(async (date: Date) => {
    if (Platform.OS === "web") return;
    const granted = await ensureCalendarPermission();
    if (!granted) return;
    setLoadingEvents(true);
    try {
      const events = await fetchEventsForDate(date);
      setCalendarEvents(events);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const applyEvent = useCallback(
    (ev: InternalCalendarEvent) => {
      const rawDate = ev.startDate instanceof Date ? ev.startDate : new Date(ev.startDate);
      const iso = !isNaN(rawDate.getTime()) ? isoFromDate(rawDate) : value;
      onChange(iso);
      if (onEventSelect) {
        onEventSelect({ date: iso, title: ev.title, location: ev.location });
      }
      setCalendarEvents([]);
    },
    [onChange, onEventSelect, value]
  );

  const displayValue = value ? formatDisplay(value) : "";

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label.toUpperCase()}
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
        </Text>
      ) : null}

      <Pressable
        onPress={openPicker}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            borderRadius: colors.radius ?? 10,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label} date picker` : "Date picker"}
        accessibilityHint="Tap to open calendar"
      >
        <Text
          style={[
            styles.triggerText,
            { color: displayValue ? colors.foreground : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Feather name="calendar" size={18} color={colors.mutedForeground} />
      </Pressable>

      {!!error && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      )}

      {loadingEvents && (
        <View style={styles.eventsLoading}>
          <ActivityIndicator size="small" color={colors.mutedForeground} />
          <Text style={[styles.eventsLoadingText, { color: colors.mutedForeground }]}>
            Checking calendar…
          </Text>
        </View>
      )}

      {calendarEvents.length > 0 && (
        <View style={[styles.eventsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.eventsHeader, { color: colors.mutedForeground }]}>
            CALENDAR EVENTS — TAP TO USE
          </Text>
          {calendarEvents.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              onPress={() => applyEvent(ev)}
              style={[styles.eventItem, { borderTopColor: colors.border }]}
            >
              <View style={styles.eventItemInner}>
                <Feather name="calendar" size={14} color={colors.primary} style={styles.eventIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {ev.title}
                  </Text>
                  {!!ev.location && (
                    <Text style={[styles.eventLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {ev.location}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setCalendarEvents([])}
            style={[styles.dismissEvents, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.dismissEventsText, { color: colors.mutedForeground }]}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === "android" && pickerOpen && (
        <DateTimePicker
          value={parseIso(value)}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={pickerOpen}
          transparent
          animationType="slide"
          onRequestClose={cancelPicker}
        >
          <View style={styles.iosModalOverlay}>
            <Pressable style={styles.iosModalBackdrop} onPress={cancelPicker} />
            <View style={[styles.iosModalSheet, { backgroundColor: colors.background }]}>
              <View style={[styles.iosModalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={cancelPicker} hitSlop={8}>
                  <Text style={[styles.iosModalAction, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.iosModalTitle, { color: colors.foreground }]}>
                  {label ?? "Select Date"}
                </Text>
                <TouchableOpacity onPress={confirmIos} hitSlop={8}>
                  <Text style={[styles.iosModalAction, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleIosChange}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "web" && pickerOpen && (
        <WebDatePicker
          value={value}
          onConfirm={(iso) => {
            setPickerOpen(false);
            onChange(iso);
          }}
          onCancel={() => setPickerOpen(false)}
          colors={colors}
          label={label}
        />
      )}
    </View>
  );
}

function WebDatePicker({
  value,
  onConfirm,
  onCancel,
  colors,
  label,
}: {
  value: string;
  onConfirm: (iso: string) => void;
  onCancel: () => void;
  colors: ReturnType<typeof useColors>;
  label?: string;
}) {
  const todayDate = new Date();
  const initDate = parseIso(value || isoFromDate(todayDate));
  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initDate.getDate());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(1);
  };

  const confirm = () => {
    const d = new Date(year, month, selectedDay);
    onConfirm(isoFromDate(d));
  };

  const isToday = (d: number) =>
    d === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.webOverlay}>
        <Pressable style={styles.webBackdrop} onPress={onCancel} />
        <View style={[styles.webSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.webHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onCancel} hitSlop={8}>
              <Text style={[styles.webAction, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.webTitle, { color: colors.foreground }]}>{label ?? "Select Date"}</Text>
            <TouchableOpacity onPress={confirm} hitSlop={8}>
              <Text style={[styles.webAction, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={8}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.calMonthYear, { color: colors.foreground }]}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={8}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.calDayHeaders}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <Text key={d} style={[styles.calDayHeader, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {cells.map((d, i) => (
              <TouchableOpacity
                key={i}
                onPress={d ? () => setSelectedDay(d) : undefined}
                style={[
                  styles.calCell,
                  { width: CAL_CELL_WIDTH },
                  d === selectedDay && { backgroundColor: colors.primary },
                  !d && { opacity: 0 },
                ]}
                disabled={!d}
              >
                {d ? (
                  <Text
                    style={[
                      styles.calCellText,
                      {
                        color: d === selectedDay
                          ? colors.primaryForeground
                          : isToday(d)
                          ? colors.primary
                          : colors.foreground,
                      },
                      isToday(d) && d !== selectedDay && styles.calCellToday,
                    ]}
                  >
                    {d}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  eventsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  eventsLoadingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  eventsList: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 2,
  },
  eventsHeader: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  eventItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventItemInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  eventIcon: { flexShrink: 0 },
  eventTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  eventLocation: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  dismissEvents: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  dismissEventsText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  iosModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  iosModalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  iosModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosModalTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  iosModalAction: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  iosPicker: {
    height: 220,
  },
  webOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  webSheet: {
    borderRadius: 16,
    borderWidth: 1,
    width: 320,
    overflow: "hidden",
  },
  webHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  webTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  webAction: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  calMonthYear: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  calDayHeaders: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  calDayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  calCell: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
  },
  calCellText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  calCellToday: {
    fontFamily: "Inter_700Bold",
  },
});
