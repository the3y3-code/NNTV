import React, { useRef, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * MetricsPanel Component
 * 
 * Visualizes the training progress using real-time charts.
 * 1. Line Chart: Tracks Loss (Error rate) and Accuracy over time.
 * 2. Bar Chart: Visualizes layer activations to show "brain activity".
 */
const MetricsPanel = ({ metrics, history }) => {

    // X-Axis Labels
    const labels = history.map(h => h.epoch + "." + h.batch);

    // --- Line Chart Data ---
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Loss (Lower is better)',
                data: history.map(h => h.loss),
                borderColor: '#ef4444',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, "rgba(239, 68, 68, 0.5)");
                    gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                yAxisID: 'y',
            },
            {
                label: 'Accuracy (Higher is better)',
                data: history.map(h => h.accuracy),
                borderColor: '#22c55e',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, "rgba(34, 197, 94, 0.5)");
                    gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                yAxisID: 'y1',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        stacked: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                display: false,
                grid: { display: false }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' },
                title: { display: true, text: 'Loss', color: '#ef4444' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { display: false },
                ticks: { color: '#94a3b8' },
                title: { display: true, text: 'Accuracy (%)', color: '#22c55e' }
            },
        },
        animation: {
            duration: 0
        }
    };

    // --- Bar Chart Data (Neural Activity) ---
    const barData = {
        labels: metrics && metrics.sample_activations ? Object.keys(metrics.sample_activations) : [],
        datasets: [{
            label: 'Mean Activation',
            data: metrics && metrics.sample_activations ? Object.values(metrics.sample_activations) : [],
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, "#c084fc");
                gradient.addColorStop(1, "#6366f1");
                return gradient;
            },
            borderRadius: 4,
            barPercentage: 0.7
        }]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#38bdf8',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                callbacks: {
                    label: (ctx) => `Activity: ${ctx.raw.toFixed(4)}`
                }
            }
        },
        scales: {
            y: {
                grid: { color: '#1e293b' },
                ticks: {
                    color: '#64748b',
                    font: { size: 10 },
                    callback: (value) => value.toFixed(2)
                },
                beginAtZero: true
            },
            x: {
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10 },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: { display: false }
            }
        }
    };

    return (
        <div className="metrics-panel" style={{ padding: '20px', borderLeft: '1px solid #334155', height: '100%', background: '#1e293b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }} >
            <h3 style={{ color: '#38bdf8', marginTop: 0 }}>Live Metrics</h3>

            {/* Numeric Stats Overview */}
            <div className="stats" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div className="stat-box" style={{ flex: 1, background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Loss</h4>
                    <p style={{ fontSize: '28px', color: '#ef4444', margin: '5px 0 0 0', fontWeight: '600' }}>
                        {metrics ? metrics.loss.toFixed(4) : '0.0000'}
                    </p>
                </div>
                <div className="stat-box" style={{ flex: 1, background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Accuracy</h4>
                    <p style={{ fontSize: '28px', color: '#22c55e', margin: '5px 0 0 0', fontWeight: '600' }}>
                        {metrics ? metrics.accuracy.toFixed(1) + '%' : '0.0%'}
                    </p>
                </div>
            </div>

            {/* Main Graph */}
            <div className="chart-container" style={{ flex: 1, minHeight: 0, marginBottom: '20px' }}>
                {/* Custom Legend (Left-aligned, Stacked) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Loss (Lower is better)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '2px' }}></span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Accuracy (Higher is better)</span>
                    </div>
                </div>

                {/* Line Chart */}
                <div style={{ marginBottom: '20px', height: '180px', position: 'relative' }}>
                    {history.length > 0 ? (
                        <Line options={options} data={chartData} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                            Waiting for training data...
                        </div>
                    )}
                </div>

                {metrics && metrics.sample_activations && (
                    <>
                        <h4 style={{ color: '#38bdf8', marginBottom: '10px', fontSize: '14px' }}>Neural Activity</h4>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                            <small style={{ color: '#64748b', fontSize: '10px' }}>Mean Activation Intensity</small>
                        </div>
                        {/* Bar Chart */}
                        <div style={{ height: '150px', position: 'relative' }}>
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default MetricsPanel;
