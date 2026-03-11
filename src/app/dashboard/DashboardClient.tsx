"use client";

import { useState } from "react";

export interface Call {
  id: string;
  callerName: string;
  phone: string;
  issue: string;
  duration: number;
  timestamp: Date;
  status: string;
}

export default function DashboardClient({ calls }: { calls: Call[] }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sarah AI — Call Log</h1>
      {calls.length === 0 ? (
        <p className="text-gray-500">No calls yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Caller</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Issue</th>
              <th className="py-2 pr-4">Duration</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr key={call.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4">{call.callerName}</td>
                <td className="py-2 pr-4">{call.phone}</td>
                <td className="py-2 pr-4">{call.issue}</td>
                <td className="py-2 pr-4">{call.duration}s</td>
                <td className="py-2">{call.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
