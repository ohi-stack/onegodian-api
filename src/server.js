import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req,res)=>res.json({name:'onegodian-api',status:'online',version:'0.1.0'}));
app.get('/health', (req,res)=>res.json({ok:true,time:new Date().toISOString()}));
app.get('/api/status', (req,res)=>res.json({service:'api.Onegodian.org',ready:true,node:process.version}));
app.post('/api/verify', (req,res)=>res.json({verified:true,input:req.body||{}}));
app.post('/api/register', (req,res)=>res.status(201).json({created:true,data:req.body||{}}));

app.listen(port, ()=>console.log(`onegodian-api listening on ${port}`));
