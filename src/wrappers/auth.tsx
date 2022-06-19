import React from 'react';
import { Navigate } from 'umi'
import { Outlet } from 'umi';

export default () => {
	const isLogin = localStorage.getItem('isLogin');
	if (!!isLogin) {
		return <Outlet></Outlet>;
	} else {
		return <Navigate to="/login" />
	}
}