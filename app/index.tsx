// 必须存在该index(?)
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { user } = useAuthStore();
  
  // 如果用户未登录，重定向到登录页
  if (!user) {
    return <Redirect href="/login" />;
  }
  
  // 如果已登录，重定向到主页
  return <Redirect href="/home" />;
}