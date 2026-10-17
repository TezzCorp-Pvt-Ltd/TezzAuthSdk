package com.tezz.auth.android;

import com.tezz.auth.android.exception.TezzAuthException;

public interface TezzCallback<T> {
    void onSuccess(T result);
    void onError(TezzAuthException error);
}
