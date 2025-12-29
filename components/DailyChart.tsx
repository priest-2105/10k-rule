import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, useColorScheme, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, getMonth, getYear } from 'date-fns';
import { DailyLog } from '@/types';
import { ThemedText } from './themed-text';

interface DailyChartProps {
  dailyLogs: DailyLog[];
}

type ChartView = 'week' | 'month' | number; // number represents days

export function DailyChart({ dailyLogs }: DailyChartProps) {
  const [selectedView, setSelectedView] = useState<ChartView>(10); // Default to 10 days
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Get available months from dailyLogs
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    dailyLogs.forEach(log => {
      const date = parseISO(log.date);
      const monthKey = format(date, 'yyyy-MM');
      monthSet.add(monthKey);
    });
    
    // Convert to array and sort descending (newest first)
    return Array.from(monthSet)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return new Date(year, month - 1, 1);
      })
      .sort((a, b) => b.getTime() - a.getTime())
      .map(date => ({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
        date,
      }));
  }, [dailyLogs]);

  const chartData = useMemo(() => {
    const endDate = new Date();
    let labels: string[] = [];
    let data: number[] = [];
    let daysToShow = 0;

    // Create a map of date -> minutes
    const logMap = new Map<string, number>();
    dailyLogs.forEach(log => {
      logMap.set(log.date, (logMap.get(log.date) || 0) + log.minutes);
    });

    if (selectedView === 'week') {
      daysToShow = 7;
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(endDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const label = format(date, 'MMM d');
        labels.push(label);
        data.push(logMap.get(dateStr) || 0);
      }
    } else if (selectedView === 'month') {
      daysToShow = 30;
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(endDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const label = format(date, 'MMM d');
        labels.push(label);
        data.push(logMap.get(dateStr) || 0);
      }
      // Show every 5th label for readability
      labels = labels.map((label, index) => index % 5 === 0 ? label : '');
    } else if (typeof selectedView === 'number') {
      daysToShow = selectedView;
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(endDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const label = format(date, 'MMM d');
        labels.push(label);
        data.push(logMap.get(dateStr) || 0);
      }
      // Show every 3rd label for 10 days
      if (daysToShow === 10) {
        labels = labels.map((label, index) => index % 3 === 0 ? label : '');
      }
    } else {
      // Month view - aggregate by month
      const monthData = availableMonths.find(m => m.key === selectedView);
      if (monthData) {
        const start = startOfMonth(monthData.date);
        const end = endOfMonth(monthData.date);
        const daysInMonth = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i < daysInMonth; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          if (date > endDate) break;
          
          const dateStr = format(date, 'yyyy-MM-dd');
          const label = format(date, 'd');
          labels.push(label);
          data.push(logMap.get(dateStr) || 0);
        }
        daysToShow = daysInMonth;
      }
    }

    return {
      labels,
      datasets: [{ data }],
      daysToShow,
    };
  }, [dailyLogs, selectedView, availableMonths]);

  const daysToShow = chartData.daysToShow;

  if (dailyLogs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No practice data yet</ThemedText>
      </View>
    );
  }

  const isMonthView = typeof selectedView === 'string' && selectedView !== 'week' && selectedView !== 'month';

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.selectorScroll}
        contentContainerStyle={styles.selectorContainer}
      >
        <TouchableOpacity
          style={[
            styles.selectorButton,
            { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
            selectedView === 10 && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedView(10)}
        >
          <ThemedText 
            style={[
              styles.selectorText,
              { color: isDark ? '#FFFFFF' : '#8E8E93' },
              selectedView === 10 && styles.selectorTextActive,
            ]}
          >
            10 Days
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.selectorButton,
            { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
            selectedView === 'week' && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedView('week')}
        >
          <ThemedText 
            style={[
              styles.selectorText,
              { color: isDark ? '#FFFFFF' : '#8E8E93' },
              selectedView === 'week' && styles.selectorTextActive,
            ]}
          >
            Last Week
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.selectorButton,
            { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
            selectedView === 'month' && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedView('month')}
        >
          <ThemedText 
            style={[
              styles.selectorText,
              { color: isDark ? '#FFFFFF' : '#8E8E93' },
              selectedView === 'month' && styles.selectorTextActive,
            ]}
          >
            Last Month
          </ThemedText>
        </TouchableOpacity>

        {availableMonths.map(month => (
          <TouchableOpacity
            key={month.key}
            style={[
              styles.selectorButton,
              { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
              selectedView === month.key && styles.selectorButtonActive,
            ]}
            onPress={() => setSelectedView(month.key)}
          >
            <ThemedText 
              style={[
                styles.selectorText,
                { color: isDark ? '#FFFFFF' : '#8E8E93' },
                selectedView === month.key && styles.selectorTextActive,
              ]}
            >
              {format(month.date, 'MMM yyyy')}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.container}>
          <BarChart
            data={{ labels: chartData.labels, datasets: chartData.datasets }}
            width={Math.max(screenWidth - 40, daysToShow * (isMonthView ? 20 : 30))}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" min"
            chartConfig={{
              backgroundColor: isDark ? '#000000' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#000000' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#000000' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              labelColor: (opacity = 1) => 
                isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: isMonthView ? 0.5 : 0.7,
            }}
            style={styles.chart}
            showValuesOnTopOfBars={!isMonthView}
            fromZero
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 20,
  },
  selectorScroll: {
    marginBottom: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorButtonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  container: {
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});

