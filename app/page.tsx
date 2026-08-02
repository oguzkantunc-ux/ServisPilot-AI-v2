'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { heuristicOrder, calculateRoadRoute, formatClock } from '@/lib/route';
import RouteMap from '@/components/RouteMap';
import type { Passenger, Destination, Vehicle, Driver, CalculatedRoute } from '@/lib/types';

const POLL_INTERVAL_MS = 120_000;

export default function Home() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [order, setOrder] = useState<Passenger[]>([]);
  const [startTime, setStartTime] = useState('07:00');
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<CalculatedRoute | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: p }, { data: d }, { data: v }, { data: dr }] = await Promise.all([
          supabase.from('passengers').select('*').order('full_name'),
          supabase.from('destinations').select('*').limit(1),
          supabase.from('vehicles').select('*').limit(1),
          supabase.from('drivers').select('*').limit(1),
        ]);
        
        setPassengers(p || []);
        setDestination(d?.[0] || null);
        setVehicle(v?.[0] || null);
        setDriver(dr?.[0] || null);

        if (p?.length && d?.[0]) {
          const ordered = heuristicOrder(p, d[0]);
          setOrder(ordered);
          const calcRoute = await calculateRoadRoute(ordered, d[0]);
          setRoute(calcRoute);
        }
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!order.length || !destination) return;
    let cancelled = false;

    const calculate = async () => {
      try {
        const calcRoute = await calculateRoadRoute(order, destination);
        if (!cancelled) setRoute(calcRoute);
      } catch (err) {
        console.error('Rota hesaplanması hatası:', err);
      }
    };

    calculate();
    const timer = setInterval(calculate, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [order, destination]);

  const onDragStart = (idx: number) => setDragIndex(idx);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(idx, 0, moved);
    setOrder(newOrder);
    setDragIndex(null);
  };

  const stats = useMemo(() => {
    if (!route) return null;
    const durationMin = route.travelTimeSeconds / 60;
    const durationMinWithoutTraffic = route.noTrafficTravelTimeSeconds / 60;
    const delayMin = durationMin - durationMinWithoutTraffic;
    const fuelL = (route.lengthMeters / 1000 * 9) / 100;
    const cost = fuelL * 45;
    return { durationMin, durationMinWithoutTraffic, delayMin, fuelL, cost, distanceKm: route.lengthMeters / 1000 };
  }, [route]);

  if (loading) return <div className="center">Yükleniyor...</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">🚐 ServisPilot AI v2</div>
        <div className="header-right">
          <label className="time-input">
            <span>Başlangıç Saati</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>
          <div className="veh-info">
            {vehicle && <span>{vehicle.plate} · {vehicle.model}</span>}
            {driver && <span> · Şoför: {driver.full_name}</span>}
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="card">
            <div className="card-title">Yolcu Sıralaması</div>
            <ul className="passenger-list">
              {order.map((p, idx) => {
                const startMin = [...order.slice(0, idx)].reduce((sum, _) => sum + 5, 0);
                const etaMin = (parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])) + startMin + (stats?.durationMin || 0) / order.length;
                return (
                  <li
                    key={p.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(idx)}
                    className="passenger-item"
                  >
                    <span className="handle">☰</span>
                    <span className="num">{idx + 1}</span>
                    <span className="name">{p.full_name}</span>
                    <span className="eta">{formatClock(startTime, startMin * 60)}</span>
                  </li>
                );
              })}
              {destination && (
                <li className="passenger-item dest">
                  <span className="num">🏁</span>
                  <span className="name">{destination.name}</span>
                  <span className="eta">{formatClock(startTime, (stats?.durationMin || 0) * 60)}</span>
                </li>
              )}
            </ul>
            <p className="hint">Sürükle-bırak ile sırayı değiştirebilirsin</p>
          </div>

          {stats && (
            <div className="card">
              <div className="card-title">Rota Özeti</div>
              <div className="stat-row"><span>Mesafe</span><b>{stats.distanceKm.toFixed(1)} km</b></div>
              <div className="stat-row"><span>Süre (Trafik)</span><b>{Math.round(stats.durationMin)} dk</b></div>
              <div className="stat-row"><span>Süre (Açık Yol)</span><b>{Math.round(stats.durationMinWithoutTraffic)} dk</b></div>
              <div className="stat-row"><span>Trafik Gecikme</span><b>{Math.round(stats.delayMin)} dk</b></div>
              <div className="stat-row"><span>Yakıt</span><b>{stats.fuelL.toFixed(1)} L</b></div>
              <div className="stat-row"><span>Tahmini Maliyet</span><b>{Math.round(stats.cost)} TL</b></div>
            </div>
          )}
        </aside>

        <main className="map-area">
          {destination && order.length > 0 && (
            <RouteMap passengers={order} destination={destination} route={route} />
          )}
          <div className="map-legend">
            <span><i className="dot dot-blue" /> Rota</span>
            <span><i className="dot dot-green" /> Akıcı</span>
            <span><i className="dot dot-orange" /> Orta</span>
            <span><i className="dot dot-red" /> Yoğun</span>
          </div>
        </main>
      </div>
    </div>
  );
