export const makeFullName = (user: any): string => {
  return `${user?.firstName} ${user?.lastName}`
}

export const timestampToTime = (seconds: number): string => {
  const timestampInSeconds = 1691210267;
  const date = new Date(timestampInSeconds * 1000); // Convert seconds to milliseconds

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  return `${formattedTime}, ${month} ${day}, ${year}`
}
