require('dotenv').config();
if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no .env');
  process.exit(1);
}
const app = require('./app');
const porta = process.env.PORT || 3000;
app.listen(porta, '0.0.0.0', () => console.log('Rodando na porta ' + porta));
