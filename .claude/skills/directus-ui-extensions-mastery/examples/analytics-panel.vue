<template>
  <div class="analytics-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>{{ title }}</h3>
      <v-button @click="refresh" icon small>
        <v-icon name="refresh" />
      </v-button>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div v-for="metric in metrics" :key="metric.id" class="metric-card">
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-label">{{ metric.label }}</div>
        <div class="metric-trend" :class="metric.trend">
          <v-icon :name="metric.trend === 'up' ? 'trending_up' : 'trending_down'" small />
          {{ metric.change }}%
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  collection: String,
  dateField: String,
  height: Number,
  width: Number,
});

const api = useApi();
const chartCanvas = ref(null);
const chart = ref(null);

const title = ref('Analytics Dashboard');
const metrics = ref([
  { id: 1, label: 'Total Sales', value: '$12,543', change: 12, trend: 'up' },
  { id: 2, label: 'New Users', value: '234', change: -5, trend: 'down' },
  { id: 3, label: 'Conversion', value: '3.4%', change: 8, trend: 'up' },
]);

async function fetchData() {
  try {
    const { data } = await api.get(`/items/${props.collection}`, {
      params: {
        aggregate: { count: '*' },
        groupBy: [props.dateField],
        limit: 30,
      },
    });

    updateChart(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function updateChart(data) {
  const ctx = chartCanvas.value.getContext('2d');

  if (chart.value) {
    chart.value.destroy();
  }

  chart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: 'Activity',
        data: data.map(d => d.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function refresh() {
  fetchData();
}

onMounted(() => {
  fetchData();
});

onUnmounted(() => {
  if (chart.value) {
    chart.value.destroy();
  }
});
</script>

<style scoped>
.analytics-panel {
  padding: var(--content-padding);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-l);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-l);
}

.metric-card {
  padding: var(--spacing-m);
  background: var(--theme--background-accent);
  border-radius: var(--theme--border-radius);
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme--primary);
}

.metric-label {
  font-size: 0.875rem;
  color: var(--theme--foreground-subdued);
  margin-top: var(--spacing-xs);
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-s);
  font-size: 0.875rem;
}

.metric-trend.up { color: var(--theme--success); }
.metric-trend.down { color: var(--theme--danger); }

.chart-container {
  flex: 1;
  position: relative;
  min-height: 200px;
}
</style>