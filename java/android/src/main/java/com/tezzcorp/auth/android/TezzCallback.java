package com.tezzcorp.auth.android;

import com.tezzcorp.auth.android.exception.TezzAuthException;

public interface TezzCallback<T> {
    void onSuccess(T result);
    void onError(TezzAuthException error);
}
