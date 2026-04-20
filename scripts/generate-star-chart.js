const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ChartDataLabels = require('chartjs-plugin-datalabels');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const repoRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(repoRoot, 'images');
const outputImagePath = path.join(imagesDir, 'star-chart.png');

// 获取星标数据，支持分页
async function fetchStargazers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ 缺少 GITHUB_TOKEN 环境变量，请设置后再运行！');
    return [];
  }

  let allStargazers = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    console.log(`📡 正在获取第 ${page} 页星标数据...`);
    const response = await fetch(`https://api.github.com/repos/iawooo/ctt/stargazers?per_page=${perPage}&page=${page}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.star+json',
        'User-Agent': 'CFTeleTrans'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GitHub API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      return [];
    }

    const stargazers = await response.json();
    allStargazers = allStargazers.concat(stargazers);

    if (stargazers.length < perPage) break;
    page++;
  }

  console.log(`✅ 成功获取 ${allStargazers.length} 条星标数据`);
  console.log('最近的星标:', allStargazers.slice(-5).map(star => star.starred_at));
  return allStargazers;
}

// 计算日期的周数（ISO 8601 周编号）
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

// 动态选择显示单位并生成图表
async function generateChart() {
  const stargazers = await fetchStargazers();
  if (stargazers.length === 0) {
    console.error('❌ 没有获取到星标数据，无法生成图表');
    return;
  }

  const starDates = stargazers.map(star => new Date(star.starred_at));
  const earliestDate = new Date(Math.min(...starDates));
  const now = new Date();

  // 计算总天数
  const totalDays = Math.ceil((now - earliestDate) / (1000 * 60 * 60 * 24));
  console.log(`总天数: ${totalDays}`);

  // 根据时间跨度选择显示单位
  let unit;
  let labels = [];
  let starCounts = [];

  if (totalDays > 0 && totalDays < 30) {
    // 使用“天”作为单位（0 天 < 时间跨度 < 30 天）
    unit = 'day';
    const daysDiff = totalDays;
    starCounts = Array(daysDiff).fill(0);
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      labels.push(dayStr);
      const count = stargazers.filter(star => {
        const starDate = new Date(star.starred_at);
        return starDate.toDateString() === date.toDateString();
      }).length;
      starCounts[daysDiff - 1 - i] = count;
    }
  } else if (totalDays >= 30 && totalDays < 180) {
    // 使用“周”作为单位（30 天 <= 时间跨度 < 180 天）
    unit = 'week';
    const weeksDiff = Math.ceil(totalDays / 7);
    starCounts = Array(weeksDiff).fill(0);
    for (let i = weeksDiff - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      const weekStr = getWeekNumber(date);
      labels.push(weekStr);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - (date.getDay() || 7) + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const count = stargazers.filter(star => {
        const starDate = new Date(star.starred_at);
        return starDate >= startOfWeek && starDate <= endOfWeek;
      }).length;
      starCounts[weeksDiff - 1 - i] = count;
    }
  } else if (totalDays >= 180 && totalDays < 1000) {
    // 使用“月”作为单位（180 天 <= 时间跨度 < 1000 天）
    unit = 'month';
    const monthsDiff = (now.getFullYear() - earliestDate.getFullYear()) * 12 + (now.getMonth() - earliestDate.getMonth()) + 1;
    starCounts = Array(monthsDiff).fill(0);
    for (let i = monthsDiff - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      labels.push(monthStr);
      const count = stargazers.filter(star => {
        const starDate = new Date(star.starred_at);
        return starDate.getFullYear() === date.getFullYear() && starDate.getMonth() === date.getMonth();
      }).length;
      starCounts[monthsDiff - 1 - i] = count;
    }
  } else if (totalDays >= 1000 && totalDays < 9999999) {
    // 使用“年”作为单位（1000 天 <= 时间跨度 < 9999999 天）
    unit = 'year';
    const yearsDiff = now.getFullYear() - earliestDate.getFullYear() + 1;
    starCounts = Array(yearsDiff).fill(0);
    for (let i = yearsDiff - 1; i >= 0; i--) {
      const year = now.getFullYear() - i;
      labels.push(year.toString());
      const count = stargazers.filter(star => {
        const starDate = new Date(star.starred_at);
        return starDate.getFullYear() === year;
      }).length;
      starCounts[yearsDiff - 1 - i] = count;
    }
  } else {
    console.error('❌ 时间跨度超出预期范围，无法生成图表');
    return;
  }

  // 累加星标数量，生成趋势数据
  for (let i = 1; i < starCounts.length; i++) {
    starCounts[i] += starCounts[i - 1];
  }

  console.log(`选择的显示单位: ${unit}`);
  console.log('横坐标标签:', labels);
  console.log('星标数量:', starCounts);
  console.log(`总星标数: ${starCounts[starCounts.length - 1]}`);

  // 创建 images 目录
  if (!fs.existsSync(imagesDir)) {
    console.log('📁 创建 images 目录...');
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // 配置图表
  const width = 800;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Star 数量',
        data: starCounts,
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Star 数量',
            font: { size: 14 }
          },
          ticks: { font: { size: 12 } }
        },
        x: {
          title: {
            display: true,
            text: unit === 'day' ? '日期' : unit === 'week' ? '周' : unit === 'month' ? '月份' : '年份',
            font: { size: 14 }
          },
          ticks: {
            font: { size: 12 },
            maxRotation: 45, // 旋转标签以避免重叠
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            font: { size: 14 }
          }
        },
        datalabels: {
          display: true,
          align: 'top',
          color: '#666',
          font: { size: 12 },
          formatter: (value) => value
        }
      }
    },
    plugins: [ChartDataLabels]
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(outputImagePath, image);
  console.log(`✅ Star chart 生成成功: ${outputImagePath}`);
}

// 运行脚本
generateChart().catch(err => {
  console.error('❌ 生成图表时发生错误:', err);
  process.exit(1);
});
