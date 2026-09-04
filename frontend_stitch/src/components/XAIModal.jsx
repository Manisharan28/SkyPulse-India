import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert, BrainCircuit, CloudLightning, MapPin, Radio, Image as ImageIcon } from 'lucide-react';
import { STATUS_COLORS } from '../utils/constants';

// Helper to auto-link URLs in text
const linkify = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => 
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">
        {part}
      </a>
    ) : part
  );
};

export default function XAIModal({ alert, onClose }) {
  if (!alert) return null;

  const StatusIcon = alert.status === 'Verified' ? CheckCircle : alert.status === 'Emerging' ? AlertTriangle : ShieldAlert;
  const color = STATUS_COLORS[alert.status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: color }}></div>
        
        <div className="p-6 overflow-y-auto">
          {/* Top Row */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-800 text-gray-300">
                {alert.event_type}
              </span>
              <span className="text-xs font-mono text-gray-500">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-gray-900 p-1 rounded-full">
              <X size={18} />
            </button>
          </div>

          {/* Tweet Content */}
          <div className="mb-4">
            <p className="text-lg text-gray-100 leading-relaxed mb-3">
              {linkify(alert.text)}
            </p>
            
            {/* Media */}
            {alert.has_media && alert.media_urls && alert.media_urls.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {alert.media_urls.map((m, i) => (
                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0">
                    <img src={m.url} alt="Media attached" className="h-24 w-24 object-cover rounded-lg border border-gray-800 hover:border-gray-600 transition-colors" />
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-mono text-gray-400">@{alert.username}</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">{alert.followers?.toLocaleString() || 0} Followers</span>
              </div>
              
              {alert.tweet_url && (
                <a href={alert.tweet_url} target="_blank" rel="noopener noreferrer" 
                   className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                  View original on X
                </a>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-gray-800 my-6"></div>

          {/* Section 1: Credibility Gauge */}
          <div className="mb-8">
            <div className="flex flex-col items-center justify-center mb-3">
              <StatusIcon size={32} style={{ color }} className="mb-2" />
              <div className="text-4xl font-bold font-mono text-white mb-1">
                {Math.round(alert.credibility_score * 100)}%
              </div>
              <div className="text-xs uppercase tracking-widest font-bold" style={{ color }}>
                {alert.status}
              </div>
            </div>
            
            <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.round(alert.credibility_score * 100)}%`, backgroundColor: color }}
              ></div>
            </div>
          </div>

          {/* Section 2: XAI Breakdown */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Explainable AI Breakdown</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400 flex items-center gap-1.5"><BrainCircuit size={14}/> NLP Confidence</span>
                  <span className="font-mono text-blue-400">{Math.round((alert.ml_confidence || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((alert.ml_confidence || 0) * 100)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400 flex items-center gap-1.5"><CloudLightning size={14}/> Weather API Match</span>
                  <span className="font-mono text-cyan-400">{Math.round((alert.weather_score || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.round((alert.weather_score || 0) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  <ImageIcon size={12}/> Media
                </div>
                <div className="text-sm text-gray-200">{alert.has_media ? 'Attached' : 'None'}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  <MapPin size={12}/> Location Source
                </div>
                <div className="text-sm text-gray-200 uppercase">{alert.location_source === 'ner' ? 'NER AI Model' : 'Device GPS'}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  <Radio size={12}/> Source
                </div>
                <div className="text-sm text-gray-200 uppercase">{alert.source || 'LIVE'}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-violet-500 bg-violet-500/20 block"/> Cluster Status
                </div>
                <div className="text-sm text-gray-200">
                  {alert.cluster_id ? `Active (Group #${alert.cluster_id})` : 'Standalone'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
