import http from 'http';

http.get('http://localhost:3001/api/schedule/97341f69-2758-4078-82c5-6cb925d4b204', (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log('--- PUBLIC SCHEDULE DATA ---');
    console.log('Available Upsells:', data.availableUpsells);
  });
});
