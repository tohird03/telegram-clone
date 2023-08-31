import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../../Firebase/firebase';
// @ts-ignore
import { DualAxes } from '@ant-design/plots';
import './statistic.scss'

export const Statistic = () => {
  const [userStatsByDay, setUserStatsByDay] = useState<{ [date: string]: any[] }>({});

  const getUsers = async () => {
    const usersQuery = query(collection(db, 'users'));

    const usersUnsubscribe = onSnapshot(usersQuery, (usersSnapshot) => {
      const mappedUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      const groupedUsersByDay = mappedUsers.reduce((acc, user) => {
        if (user.data && user.data.createdAt) {
          const createdAt = user.data.createdAt.toDate();
          const dateString = createdAt.toISOString().split('T')[0];

          if (!acc[dateString]) {
            acc[dateString] = [];
          }
          acc[dateString].push(user);
        }

        return acc;
      }, {} as { [date: string]: any[] });

      setUserStatsByDay(groupedUsersByDay);
    });
  };

  useEffect(() => {
    getUsers();
  }, []);

  // Create an array of dates starting from the earliest user creation date up to today
  const currentDate = new Date();
  const dateKeys = Object.keys(userStatsByDay);
  const startDate = dateKeys.length > 0 ? new Date(dateKeys[0]) : currentDate;
  const endDate = currentDate;

  const allDates = [];
  for (let currentDateIter = new Date(startDate); currentDateIter <= endDate; currentDateIter.setDate(currentDateIter.getDate() + 1)) {
    allDates.push(currentDateIter.toISOString().split('T')[0]);
  }

  // Create data for chart, including days with zero users
  const dataForChart = allDates.map((dateString) => ({
    time: dateString,
    Users: userStatsByDay[dateString]?.length || 0,
    Add: userStatsByDay[dateString]?.length || 0,
  }));

  const config = {
    data: [dataForChart, dataForChart],
    xField: 'time',
    yField: ['Users', 'Add'],
    geometryOptions: [
      {
        geometry: 'column',
      },
    ],
  };

  return (
    <div className="statistic">
      <h2>Telegramga qo'shilgan userlar</h2>
      <DualAxes className='dual' {...config} />
    </div>
  );
};
