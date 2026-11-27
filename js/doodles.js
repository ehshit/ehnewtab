(() => {
  'use strict';

  const BASE = 'assets/seasonal/';
  const loaded = new Set();
  const thanksgivingDay = (year) => {
    const first = new Date(year, 10, 1);
    const offset = (4 - first.getDay() + 7) % 7;
    return 1 + offset + 21;
  };

  const SEASONAL = {
    christmas: {
      name: 'Christmas',
      file: 'christmas.js',
      date: (y) => new Date(y, 11, 25),
      dates: [
        { value: '12-01', label: 'Christmas' },
        { value: '12-23', label: 'Countdown' },
        { value: '12-31', label: "New Year's Eve", time: '23:59:50' },
        { value: '01-01', label: 'New Year' },
      ],
    },
    valentine: { name: "Valentine's Day", file: 'valentine.js', date: (y) => new Date(y, 1, 14) },
    yuri: {
      name: 'Yuri Day',
      file: 'yuri.js',
      date: (y) => new Date(y, 3, 9),
      dates: [
        { value: '04-09', label: 'Yuri Day / Sapphic Visibility' },
        { value: '02-18', label: 'Yuri Day (Feb 18)' },
        { value: '12-23', label: 'Yuri Day (Dec 23)' },
      ],
    },
    pride: {
      name: 'Pride Month',
      file: 'pride.js',
      date: (y) => new Date(y, 5, 15),
      dates: [
        { value: '06-15', label: 'Pride Month (general)' },
        { value: '03-31', label: 'Trans Day of Visibility' },
        { value: '05-04', label: 'Trans History Week' },
        { value: '06-01', label: 'LGBTQ Families Day' },
        { value: '06-05', label: 'Aromantic Visibility Day' },
        { value: '06-25', label: 'Rainbow Flag Day' },
        { value: '06-26', label: 'Marriage Equality Day' },
        { value: '06-28', label: 'Stonewall / Gay Pride' },
        { value: '06-30', label: 'Forever Pride' },
        { value: '08-19', label: 'Trans Flag Day' },
        { value: '11-13', label: 'Trans Awareness Week' },
        { value: '11-20', label: 'Trans Day of Remembrance' },
      ],
    },
    summer: { name: 'Summer', file: 'summer.js', date: (y) => new Date(y, 6, 15) },
    lancer: { name: 'Lancer', file: 'lancer.js', date: (y) => new Date(y, 8, 10) },
    queen: {
      name: 'Queen',
      file: 'queen.js',
      date: (y) => new Date(y, 8, 21),
      dates: [
        { value: '09-21', label: 'Queen' },
        { value: '09-21@23:59:50', label: '10 seconds before queen disappears', time: '23:59:50' },
      ],
    },
    halloween: { name: 'Halloween', file: 'halloween.js', date: (y) => new Date(y, 9, 31) },
    nov1: { name: 'November 1', file: 'nov1.js', date: (y) => new Date(y, 10, 1) },
    nov5: {
      name: 'November 5',
      file: 'nov5.js',
      date: (y) => new Date(y, 10, 5),
      dates: [
        { value: '11-05', label: 'November 5' },
        { value: '11-08', label: 'Snow (Nov 8)' },
        { value: '11-10', label: 'Snow (Nov 10)' },
      ],
    },
    thanksgiving: {
      name: 'Thanksgiving',
      file: 'thanksgiving.js',
      date: (y) => new Date(y, 10, thanksgivingDay(y)),
    },
    blahaj: {
      name: 'Blahaj Day',
      file: 'blahaj.js',
      date: (y) => new Date(y, 0, 16),
      dates: [
        { value: '01-16', label: 'Blahaj (days 1-3)' },
        { value: '01-19', label: 'Blahaj (days 4-8)' },
        { value: '01-24', label: 'Blahaj (days 9-14)' },
        { value: '01-30', label: 'Blahaj (day 15)' },
        { value: '01-30@23:59:45', label: 'Blahaj (15 seconds before blahaj disappears)', time: '23:59:45' },
      ],
    },
    meow: { name: 'Meow Day', file: 'meow.js', date: (y) => new Date(y, 2, 22) },
  };

  const inject = (file) => {
    if (loaded.has(file)) return;
    loaded.add(file);
    const script = document.createElement('script');
    script.src = BASE + file;
    script.defer = true;
    document.head.appendChild(script);
  };

  const getScripts = (date) => {
    const month = date.getMonth();
    const day = date.getDate();
    const scripts = [];

    if (month === 0 && day === 15) scripts.push('meow.js');
    if (month === 0 && day >= 16 && day <= 30) scripts.push('blahaj.js');
    if (month === 0 && day >= 1 && day <= 4) scripts.push('christmas.js');
    if (month === 1 && day === 14) scripts.push('valentine.js');
    if (month === 1 && day === 18) scripts.push('yuri.js');
    if (month === 2 && day === 22) scripts.push('meow.js');
    if (month === 2 && day === 31) scripts.push('pride.js');
    if (month === 3 && day === 9) scripts.push('yuri.js');
    if (month === 4 && day >= 4 && day <= 10) scripts.push('pride.js');
    if (month === 5) scripts.push('pride.js');
    if (month >= 5 && month <= 7) scripts.push('summer.js');
    if (month === 7 && day === 19) scripts.push('pride.js');
    if (month === 8 && day >= 8 && day <= 14) scripts.push('lancer.js');
    if (month === 8 && day === 21) scripts.push('queen.js');
    if (month === 9 && day === 31) scripts.push('halloween.js');
    if (month === 10 && day === 1) scripts.push('nov1.js');
    if (month === 10 && day >= 5 && day <= 10) scripts.push('nov5.js');
    if (month === 10 && day === thanksgivingDay(date.getFullYear())) scripts.push('thanksgiving.js');
    if (month === 10 && day >= 13 && day <= 20) scripts.push('pride.js');
    if (month === 11 && day === 23) scripts.push('yuri.js');
    if (month === 11) scripts.push('christmas.js');

    return [...new Set(scripts)];
  };

  const start = (choice = 'auto', dateValue = '') => {
    const selected = SEASONAL[choice];
    if (selected) {
      const year = new Date().getFullYear();
      let date = selected.date(year);
      if (dateValue) {
        const [datePart, timePart] = String(dateValue).split('@');
        const [month, day] = datePart.split('-').map(Number);
        date = new Date(year, month - 1, day);
        const variant = selected.dates?.find((entry) => entry.value === dateValue);
        const time = variant?.time || timePart;
        if (time) {
          const [hours, minutes, seconds] = time.split(':').map(Number);
          date.setHours(hours, minutes, seconds, 0);
        }
      }
      window.MEW_FORCE_DOODLE = choice;
      window.MEW_FORCE_DATE = date.toISOString();
      window.MEW_FORCE_TIME = date.getTime();
      window.MEW_FORCE_STARTED = Date.now();
      window.MEW_NOW = () => new Date(window.MEW_FORCE_TIME + (Date.now() - window.MEW_FORCE_STARTED));
      inject(selected.file);
      return;
    }
    window.MEW_NOW = null;
    for (const file of getScripts(new Date())) inject(file);
  };

  window.MEW_SEASONAL = { SEASONAL, getScripts, start };
})();