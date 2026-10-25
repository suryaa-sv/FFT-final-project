/* ==========================================================================
   CRICKETX — CHART.JS VISUALIZATION MANAGER
   Dynamic interactive charts styled with Dark Navy & Cricket Green theme
   ========================================================================== */

const ChartManager = (() => {
  const chartInstances = {};

  function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
      delete chartInstances[canvasId];
    }
  }

  // Common defaults
  const fontConfig = {
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    size: 11
  };

  // 1. Performance Distribution (Histogram / Bar)
  function renderDistributionChart(canvasId, distribution) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Excellent (85-100)', 'Good (70-84)', 'Average (50-69)', 'Needs Improvement (<50)'],
        datasets: [{
          label: 'Player Count',
          data: [
            distribution['Excellent'] || 0,
            distribution['Good'] || 0,
            distribution['Average'] || 0,
            distribution['Needs Improvement'] || 0
          ],
          backgroundColor: [
            'rgba(245, 158, 11, 0.85)',
            'rgba(0, 208, 132, 0.85)',
            'rgba(56, 189, 248, 0.85)',
            'rgba(239, 68, 68, 0.85)'
          ],
          borderColor: [
            '#f59e0b',
            '#00d084',
            '#38bdf8',
            '#ef4444'
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#152238',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: '#293d62',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', precision: 0, font: fontConfig }
          }
        }
      }
    });
  }

  // 2. Role Breakdown (Doughnut)
  function renderRoleChart(canvasId, roleData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'],
        datasets: [{
          data: [
            roleData['Batsman'] || 0,
            roleData['Bowler'] || 0,
            roleData['All-Rounder'] || 0,
            roleData['Wicketkeeper'] || 0
          ],
          backgroundColor: [
            '#38bdf8',
            '#f43f5e',
            '#00d084',
            '#f59e0b'
          ],
          borderColor: '#121c31',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f8fafc',
              font: fontConfig,
              padding: 14,
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: '#152238',
            borderColor: '#293d62',
            borderWidth: 1
          }
        },
        cutout: '68%'
      }
    });
  }

  // 3. Team Performance Comparison (Bar)
  function renderTeamPerformanceChart(canvasId, teamAverages) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    const labels = teamAverages.map(t => t.short_name);
    const scores = teamAverages.map(t => t.avg_score);
    const colors = teamAverages.map(t => t.primary_color || '#00d084');

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Team Avg Performance Score',
          data: scores,
          backgroundColor: colors.map(c => `${c}cc`),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#152238',
            borderColor: '#293d62',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          },
          y: {
            min: 50,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          }
        }
      }
    });
  }

  // 4. Batting vs Bowling Ratings (Comparative Bar / Scatter)
  function renderBattingVsBowlingChart(canvasId, pointsData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    // Display top 10 players side-by-side batting vs bowling ratings
    const topPlayers = pointsData.slice(0, 8);
    const labels = topPlayers.map(p => p.name.split(' ')[0] || p.name);
    const batScores = topPlayers.map(p => p.batting_score);
    const bowlScores = topPlayers.map(p => p.bowling_score);

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Batting Rating',
            data: batScores,
            backgroundColor: 'rgba(56, 189, 248, 0.8)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Bowling Rating',
            data: bowlScores,
            backgroundColor: 'rgba(244, 63, 94, 0.8)',
            borderColor: '#f43f5e',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f8fafc', font: fontConfig }
          },
          tooltip: {
            backgroundColor: '#152238',
            borderColor: '#293d62',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          }
        }
      }
    });
  }

  // 5. Player Match Performance Trends
  function renderTrendsChart(canvasId, matchLogs) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    const ordered = [...matchLogs].reverse();
    const labels = ordered.map((m, i) => `M${i + 1} vs ${m.opponent.split(' ')[0]}`);
    const scores = ordered.map(m => m.match_score);
    const runs = ordered.map(m => m.runs);
    const wickets = ordered.map(m => m.wickets);

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Match Performance Score',
            data: scores,
            borderColor: '#00d084',
            backgroundColor: 'rgba(0, 208, 132, 0.1)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#00d084',
            pointRadius: 5
          },
          {
            label: 'Runs Scored',
            data: runs,
            borderColor: '#38bdf8',
            borderDash: [5, 5],
            borderWidth: 2,
            tension: 0.2,
            pointBackgroundColor: '#38bdf8',
            pointRadius: 4
          },
          {
            label: 'Wickets Taken',
            data: wickets,
            borderColor: '#f43f5e',
            borderWidth: 2,
            tension: 0.2,
            pointBackgroundColor: '#f43f5e',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f8fafc', font: fontConfig }
          },
          tooltip: {
            backgroundColor: '#152238',
            borderColor: '#293d62',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', font: fontConfig }
          }
        }
      }
    });
  }

  // 6. Multi-Player Radar Comparison
  function renderRadarComparison(canvasId, playersList) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    const radarColors = [
      { border: '#00d084', bg: 'rgba(0, 208, 132, 0.25)' },
      { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)' },
      { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.25)' },
      { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.25)' }
    ];

    const datasets = playersList.map((p, idx) => {
      const color = radarColors[idx % radarColors.length];
      return {
        label: p.name,
        data: [
          p.radar.batting,
          p.radar.bowling,
          p.radar.fielding,
          p.radar.fitness,
          p.radar.form,
          p.radar.impact
        ],
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2.5,
        pointBackgroundColor: color.border,
        pointHoverRadius: 6
      };
    });

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Batting Rating', 'Bowling Rating', 'Fielding Sharpness', 'Fitness & Stamina', 'Current Form', 'Match Impact'],
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#f8fafc', font: fontConfig, padding: 15 }
          },
          tooltip: {
            backgroundColor: '#152238',
            borderColor: '#293d62',
            borderWidth: 1
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              display: false,
              stepSize: 20
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            pointLabels: {
              color: '#94a3b8',
              font: { ...fontConfig, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  return {
    renderDistributionChart,
    renderRoleChart,
    renderTeamPerformanceChart,
    renderBattingVsBowlingChart,
    renderTrendsChart,
    renderRadarComparison,
    destroyChart
  };
})();
