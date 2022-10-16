
import Cryptr from 'cryptr';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('expected a valid ENCRYPTION_KEY env');
}

export const cryptr = new Cryptr(process.env.ENCRYPTION_KEY); 
