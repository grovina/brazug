const COLORS = [
  '#2d5016','#4a7c28','#7fb547','#b8860b','#d4a843',
  '#8b4513','#cd853f','#2f4f4f','#5f9ea0','#708090',
  '#9370db','#db7093','#20b2aa','#f4a460','#778899',
];

const FONT = { family: "'Inter', sans-serif" };

Chart.defaults.font.family = FONT.family;
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 10;
Chart.defaults.animation.duration = 800;

const top15 = DATA.participants.slice(0, 15);
const top15Names = top15.map(p => p.short);
const top15Full = top15.map(p => p.name);
const top10 = DATA.participants.slice(0, 10);

// ===== PARTICIPATION DONUT =====
new Chart(document.getElementById('chart-participation'), {
  type: 'bar',
  data: {
    labels: DATA.participants.slice(0, 20).map(p => p.short),
    datasets: [{
      label: 'Messages',
      data: DATA.participants.slice(0, 20).map(p => p.messages),
      backgroundColor: DATA.participants.slice(0, 20).map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 4,
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Message Count by Participant (Top 20)', font: { size: 14, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const p = DATA.participants[ctx.dataIndex];
            return `${p.name}: ${p.messages.toLocaleString()} messages (${p.pct}%)`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } }
    }
  }
});

// ===== WORDS PER MESSAGE =====
new Chart(document.getElementById('chart-words-per-msg'), {
  type: 'bar',
  data: {
    labels: top15Names,
    datasets: [
      {
        label: 'Avg words/msg',
        data: top15.map(p => p.avg_words),
        backgroundColor: COLORS[3],
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Total words (thousands)',
        data: top15.map(p => Math.round(p.words / 1000)),
        backgroundColor: COLORS[0] + '55',
        borderColor: COLORS[0],
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y1',
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Verbosity Index: Words per Message & Total Volume', font: { size: 14, weight: 'bold' } }
    },
    scales: {
      y: { position: 'left', title: { display: true, text: 'Avg words/msg' }, grid: { display: false } },
      y1: { position: 'right', title: { display: true, text: 'Total words (K)' }, grid: { drawOnChartArea: false } },
      x: { grid: { display: false } }
    }
  }
});

// ===== HEATMAP (as matrix chart using bubble) =====
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const maxHeat = Math.max(...DATA.heatmap_flat.map(d => d.value));
const heatmapData = DATA.heatmap_flat.map(d => ({
  x: d.day,
  y: d.hour,
  v: d.value,
}));

new Chart(document.getElementById('chart-heatmap'), {
  type: 'bubble',
  data: {
    datasets: [{
      data: heatmapData.map(d => ({ x: d.x, y: d.y, r: Math.max(1, Math.sqrt(d.v / maxHeat) * 18) })),
      backgroundColor: heatmapData.map(d => {
        const intensity = d.v / maxHeat;
        const r = Math.round(45 + (1 - intensity) * 200);
        const g = Math.round(80 + (1 - intensity) * 170);
        const b = Math.round(22 + (1 - intensity) * 220);
        return `rgba(${r},${g},${b},0.8)`;
      }),
    }]
  },
  options: {
    responsive: true,
    aspectRatio: 2.5,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Activity Heatmap: Hour × Day of Week', font: { size: 14, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = heatmapData[ctx.dataIndex];
            return `${days[d.x]} ${d.y}:00 — ${d.v} messages`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: -0.5, max: 6.5,
        ticks: { callback: (v) => days[v] || '', stepSize: 1 },
        grid: { display: false },
      },
      y: {
        min: -0.5, max: 23.5,
        reverse: true,
        ticks: {
          callback: (v) => Number.isInteger(v) ? `${v}:00` : '',
          stepSize: 2,
        },
        grid: { color: '#f0f0f0' },
      }
    }
  }
});

// ===== WEEKDAY BAR =====
const weekdayCounts = [0,0,0,0,0,0,0];
DATA.heatmap_flat.forEach(d => { weekdayCounts[d.day] += d.value; });

new Chart(document.getElementById('chart-weekday'), {
  type: 'bar',
  data: {
    labels: days,
    datasets: [{
      data: weekdayCounts,
      backgroundColor: weekdayCounts.map((v, i) => i === 4 ? COLORS[3] : COLORS[0] + '88'),
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Messages by Day of Week', font: { size: 14, weight: 'bold' } }
    },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' } } }
  }
});

// ===== TIMELINE (rolling avg) =====
new Chart(document.getElementById('chart-timeline'), {
  type: 'line',
  data: {
    labels: DATA.daily_activity.labels,
    datasets: [{
      label: '7-day rolling average',
      data: DATA.daily_activity.values,
      borderColor: COLORS[0],
      backgroundColor: COLORS[0] + '22',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 1.5,
    }]
  },
  options: {
    responsive: true,
    aspectRatio: 3,
    plugins: {
      title: { display: true, text: 'Group Activity Over Time (7-day rolling average)', font: { size: 14, weight: 'bold' } },
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 12, maxRotation: 45 },
      },
      y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'msgs/day' } }
    }
  }
});

// ===== MONTHLY STACKED =====
const monthlyDatasets = top15Full.map((name, i) => ({
  label: top15Names[i],
  data: DATA.monthly_by_person[name],
  backgroundColor: COLORS[i],
  borderWidth: 0,
}));
monthlyDatasets.push({
  label: 'Others',
  data: DATA.monthly_other,
  backgroundColor: '#ccc',
  borderWidth: 0,
});

new Chart(document.getElementById('chart-monthly-stacked'), {
  type: 'bar',
  data: { labels: DATA.monthly_labels, datasets: monthlyDatasets },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Monthly Activity by Participant', font: { size: 14, weight: 'bold' } },
      legend: { position: 'bottom', labels: { font: { size: 10 } } },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { maxRotation: 45, maxTicksLimit: 20 },
      },
      y: { stacked: true, grid: { color: '#f0f0f0' } }
    }
  }
});

// ===== LAUGHTER STYLES =====
new Chart(document.getElementById('chart-laughter'), {
  type: 'bar',
  data: {
    labels: top10.map(p => p.short),
    datasets: [
      {
        label: 'kkkk',
        data: top10.map(p => DATA.laugh_styles[p.name]?.kkkk || 0),
        backgroundColor: '#009c3b',
        borderRadius: 4,
      },
      {
        label: 'hahaha',
        data: top10.map(p => DATA.laugh_styles[p.name]?.hahaha || 0),
        backgroundColor: '#ffdf00',
        borderRadius: 4,
      },
      {
        label: '😂🤣 emoji',
        data: top10.map(p => DATA.laugh_styles[p.name]?.emoji || 0),
        backgroundColor: '#002776',
        borderRadius: 4,
      },
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Laughter Style by Participant', font: { size: 14, weight: 'bold' } },
      legend: { position: 'bottom' },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: '#f0f0f0' } }
    }
  }
});

// ===== VOCABULARY RICHNESS =====
const vocabSorted = top15Full
  .map(name => ({ name: name.split(' ')[0], ...DATA.vocab_richness[name] }))
  .sort((a, b) => b.ratio - a.ratio);

new Chart(document.getElementById('chart-vocab'), {
  type: 'bar',
  data: {
    labels: vocabSorted.map(v => v.name),
    datasets: [{
      label: 'Unique/Total ratio',
      data: vocabSorted.map(v => v.ratio),
      backgroundColor: vocabSorted.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Vocabulary Richness (unique words / total words)', font: { size: 14, weight: 'bold' } },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = vocabSorted[ctx.dataIndex];
            return `${v.unique.toLocaleString()} unique / ${v.total.toLocaleString()} total = ${v.ratio.toFixed(4)}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'Ratio' } }
    }
  }
});

// ===== MESSAGE LENGTH DISTRIBUTION =====
const lengthBins = ['1-5', '6-10', '11-20', '21-50', '51-100', '100+'];
const lengthColors = ['#2d5016', '#4a7c28', '#7fb547', '#b8860b', '#d4a843', '#8b4513'];

new Chart(document.getElementById('chart-msg-length'), {
  type: 'bar',
  data: {
    labels: top10.map(p => p.short),
    datasets: lengthBins.map((bin, i) => ({
      label: `${bin} words`,
      data: top10.map(p => DATA.length_distribution[p.name]?.[bin] || 0),
      backgroundColor: lengthColors[i],
    }))
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Message Length Distribution (word count)', font: { size: 14, weight: 'bold' } },
      legend: { position: 'bottom', labels: { font: { size: 10 } } },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: '#f0f0f0' } }
    }
  }
});

// ===== RESPONSE TIME =====
const respSorted = top15Full
  .map(name => ({ name: name.split(' ')[0], ...DATA.response_times[name] }))
  .sort((a, b) => a.median - b.median);

new Chart(document.getElementById('chart-response'), {
  type: 'bar',
  data: {
    labels: respSorted.map(r => r.name),
    datasets: [
      {
        label: 'Median (min)',
        data: respSorted.map(r => r.median),
        backgroundColor: COLORS[0],
        borderRadius: 4,
      },
      {
        label: 'Average (min)',
        data: respSorted.map(r => r.avg),
        backgroundColor: COLORS[3] + '88',
        borderRadius: 4,
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Response Time (minutes, within same conversation)', font: { size: 14, weight: 'bold' } },
      legend: { position: 'bottom' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'minutes' } }
    }
  }
});

// ===== CONVERSATION STARTERS =====
const startersSorted = top15Full
  .map(name => ({ name: name.split(' ')[0], count: DATA.conversation_starters[name] || 0 }))
  .sort((a, b) => b.count - a.count);

new Chart(document.getElementById('chart-starters'), {
  type: 'bar',
  data: {
    labels: startersSorted.map(s => s.name),
    datasets: [{
      label: 'Conversation starts',
      data: startersSorted.map(s => s.count),
      backgroundColor: startersSorted.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Conversation Starters (broke silence of 4+ hours)', font: { size: 14, weight: 'bold' } },
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' } }
    }
  }
});

// ===== TOP PAIRS =====
new Chart(document.getElementById('chart-pairs'), {
  type: 'bar',
  data: {
    labels: DATA.top_pairs.map(p => `${p.pair[0]} ↔ ${p.pair[1]}`),
    datasets: [{
      label: 'Sequential responses',
      data: DATA.top_pairs.map(p => p.count),
      backgroundColor: DATA.top_pairs.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 4,
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    aspectRatio: 1.8,
    plugins: {
      title: { display: true, text: 'Top Conversational Pairs (bidirectional response frequency)', font: { size: 14, weight: 'bold' } },
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: '#f0f0f0' } },
      y: { grid: { display: false } }
    }
  }
});

// ===== EDITED MESSAGES =====
const editedData = top15.map(p => ({ name: p.short, value: p.edited })).sort((a, b) => b.value - a.value).slice(0, 10);
new Chart(document.getElementById('chart-edited'), {
  type: 'bar',
  data: {
    labels: editedData.map(d => d.name),
    datasets: [{ data: editedData.map(d => d.value), backgroundColor: COLORS[3], borderRadius: 4 }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { maxRotation: 45 } }, y: { grid: { color: '#f0f0f0' } } }
  }
});

// ===== DELETED MESSAGES =====
const deletedData = top15.map(p => ({ name: p.short, value: p.deleted })).sort((a, b) => b.value - a.value).slice(0, 10);
new Chart(document.getElementById('chart-deleted'), {
  type: 'bar',
  data: {
    labels: deletedData.map(d => d.name),
    datasets: [{ data: deletedData.map(d => d.value), backgroundColor: COLORS[5], borderRadius: 4 }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { maxRotation: 45 } }, y: { grid: { color: '#f0f0f0' } } }
  }
});

// ===== PROFANITY =====
const profaneData = top15.map(p => ({ name: p.short, value: p.profane })).sort((a, b) => b.value - a.value).slice(0, 10);
new Chart(document.getElementById('chart-profanity'), {
  type: 'bar',
  data: {
    labels: profaneData.map(d => d.name),
    datasets: [{ data: profaneData.map(d => d.value), backgroundColor: COLORS[11], borderRadius: 4 }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { maxRotation: 45 } }, y: { grid: { color: '#f0f0f0' } } }
  }
});

// ===== NIGHT OWL =====
const nightData = top15Full
  .map(name => ({ name: name.split(' ')[0], pct: DATA.fun_stats.night_pct[name] || 0 }))
  .sort((a, b) => b.pct - a.pct);

new Chart(document.getElementById('chart-night'), {
  type: 'bar',
  data: {
    labels: nightData.map(d => d.name),
    datasets: [{
      label: '% nocturnal',
      data: nightData.map(d => d.pct),
      backgroundColor: nightData.map(d => d.pct > 5 ? '#1a1a2e' : '#2f4f4f88'),
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Night Owl Index (% messages between 00:00–05:59)', font: { size: 14, weight: 'bold' } },
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' }, title: { display: true, text: '%' } }
    }
  }
});

// ===== CONSECUTIVE STREAKS =====
const streakData = top15Full
  .map(name => ({ name: name.split(' ')[0], streak: DATA.fun_stats.consecutive_day_streaks[name] || 0 }))
  .sort((a, b) => b.streak - a.streak);

new Chart(document.getElementById('chart-streaks'), {
  type: 'bar',
  data: {
    labels: streakData.map(d => d.name),
    datasets: [{
      label: 'Consecutive days',
      data: streakData.map(d => d.streak),
      backgroundColor: streakData.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Longest Consecutive Day Streak (no missed days)', font: { size: 14, weight: 'bold' } },
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'days' } }
    }
  }
});

// ===== YEARLY RANKINGS =====
const years = Object.keys(DATA.yearly_rankings).sort();
const yearlyPeople = new Set();
years.forEach(y => DATA.yearly_rankings[y].forEach(p => yearlyPeople.add(p.full)));

const yearlyDatasets = [];
const yearlyPeopleArr = [...yearlyPeople];
yearlyPeopleArr.slice(0, 15).forEach((person, i) => {
  yearlyDatasets.push({
    label: person.split(' ')[0],
    data: years.map(y => {
      const found = DATA.yearly_rankings[y].find(p => p.full === person);
      return found ? found.count : 0;
    }),
    backgroundColor: COLORS[i % COLORS.length],
  });
});

new Chart(document.getElementById('chart-yearly'), {
  type: 'bar',
  data: { labels: years, datasets: yearlyDatasets },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Annual Power Rankings (top contributors per year)', font: { size: 14, weight: 'bold' } },
      legend: { position: 'bottom', labels: { font: { size: 10 } } },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: '#f0f0f0' } }
    }
  }
});

// ===== PARTICIPANT TABLE =====
const tbody = document.getElementById('participant-tbody');
DATA.participants.forEach((p, i) => {
  const rc = (p.kkkk + p.hahaha) > 0 ? (p.kkkk / (p.kkkk + p.hahaha)).toFixed(3) : '—';
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${i + 1}</td>
    <td style="font-weight:600; text-align:left">${p.name}</td>
    <td>${p.messages.toLocaleString()}</td>
    <td>${p.pct}%</td>
    <td>${p.words.toLocaleString()}</td>
    <td>${p.avg_words}</td>
    <td>${p.media}</td>
    <td>${p.kkkk}</td>
    <td>${p.hahaha}</td>
    <td>${rc}</td>
    <td>${p.questions}</td>
    <td>${p.links}</td>
    <td>${p.edited}</td>
    <td>${p.deleted}</td>
    <td>${p.profane}</td>
  `;
  tbody.appendChild(row);
});
