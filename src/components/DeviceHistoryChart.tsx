import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 200;
const PADDING = 20;

interface HistoryPoint {
  value: number;
  createdAt: string;
  status?: string;
}

interface DeviceHistoryChartProps {
  data: HistoryPoint[];
  unit?: string;
  threshold?: number;
  period: string;
}

export function DeviceHistoryChart({ data, unit = '', threshold, period }: DeviceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
        <Text style={styles.emptySubtext}>
          Les données historiques apparaîtront ici une fois que le capteur aura envoyé des valeurs
        </Text>
      </View>
    );
  }

  // Calculer les valeurs min/max pour l'échelle
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Éviter division par zéro
  
  // Ajouter une marge de 10% en haut et en bas
  const margin = valueRange * 0.1;
  const chartMin = minValue - margin;
  const chartMax = maxValue + margin;
  const chartRange = chartMax - chartMin;

  // Dimensions du graphique
  const graphWidth = CHART_WIDTH - PADDING * 2;
  const graphHeight = CHART_HEIGHT - PADDING * 2;

  // Convertir les données en points SVG
  const points = data.map((point, index) => {
    const x = PADDING + (index / (data.length - 1 || 1)) * graphWidth;
    const y = PADDING + graphHeight - ((point.value - chartMin) / chartRange) * graphHeight;
    return { x, y, value: point.value, time: point.createdAt };
  });

  // Créer la ligne du graphique
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Points pour afficher les valeurs
  const circles = points.map((point, index) => {
    // Afficher seulement quelques points pour éviter la surcharge
    const showPoint = index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 8) === 0;
    return showPoint ? (
      <Circle
        key={index}
        cx={point.x}
        cy={point.y}
        r={4}
        fill={colors.primary}
        stroke={colors.cardBackground}
        strokeWidth={2}
      />
    ) : null;
  });

  // Ligne de seuil si défini
  const thresholdY = threshold !== undefined
    ? PADDING + graphHeight - ((threshold - chartMin) / chartRange) * graphHeight
    : null;

  // Format de la date selon la période
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (period === '15m' || period === '1h') {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (period === '6h' || period === '24h') {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Labels d'axe X (temps)
  const xLabels = points.length > 0 ? [
    points[0],
    points[Math.floor(points.length / 2)],
    points[points.length - 1],
  ].filter(Boolean) : [];

  // Labels d'axe Y (valeurs)
  const yLabels = [
    { value: chartMax, y: PADDING },
    { value: (chartMin + chartMax) / 2, y: PADDING + graphHeight / 2 },
    { value: chartMin, y: PADDING + graphHeight },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grille horizontale */}
          {yLabels.map((label, index) => (
            <Line
              key={`grid-${index}`}
              x1={PADDING}
              y1={label.y}
              x2={PADDING + graphWidth}
              y2={label.y}
              stroke={colors.cardBorder}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.3}
            />
          ))}

          {/* Ligne de seuil */}
          {thresholdY !== null && thresholdY >= PADDING && thresholdY <= PADDING + graphHeight && (
            <>
              <Line
                x1={PADDING}
                y1={thresholdY}
                x2={PADDING + graphWidth}
                y2={thresholdY}
                stroke={colors.warning}
                strokeWidth={2}
                strokeDasharray="8,4"
                opacity={0.6}
              />
              <SvgText
                x={PADDING + graphWidth - 5}
                y={thresholdY - 5}
                fontSize="10"
                fill={colors.warning}
                textAnchor="end"
              >
                Seuil: {threshold?.toFixed(1)}{unit}
              </SvgText>
            </>
          )}

          {/* Ligne du graphique */}
          <Polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
          />

          {/* Points */}
          {circles}

          {/* Labels axe Y (valeurs) */}
          {yLabels.map((label, index) => (
            <SvgText
              key={`y-label-${index}`}
              x={PADDING - 5}
              y={label.y + 4}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="end"
            >
              {label.value.toFixed(1)}
            </SvgText>
          ))}

          {/* Labels axe X (temps) */}
          {xLabels.map((point, index) => (
            <SvgText
              key={`x-label-${index}`}
              x={point.x}
              y={CHART_HEIGHT - 5}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor={index === 0 ? 'start' : index === xLabels.length - 1 ? 'end' : 'middle'}
            >
              {formatTime(point.time)}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Valeur</Text>
        </View>
        {threshold !== undefined && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.warning, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.warning }]} />
            <Text style={styles.legendText}>Seuil ({threshold}{unit})</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  chartContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
