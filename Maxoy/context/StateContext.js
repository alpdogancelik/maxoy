import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { getPriceForMode } from "../lib/productUtils";
import { t } from "../constants/i18n";
import { setAuthCookie } from "../lib/auth";
import { buildCartTotals, calculateCartSubtotal } from "../lib/cartPricing";
import { loadAddresses, saveAddresses, generateAddressId } from "../lib/addressStore";
import { validateCoupon } from "../lib/coupons";
import { analytics } from "../lib/analytics";

const Context = createContext();

const CART_STORAGE_KEY = "maxoy-cart";
const PREFS_STORAGE_KEY = "maxoy-preferences";
const AUTH_STORAGE_KEY = "maxoy-auth";

const emptyAuthInfo = {
  registration: {
    fullName: "",
    company: "",
    phone: "",
    email: "",
    password: "",
  },
  login: {
    email: "",
    password: "",
  },
  lastRegistrationAt: "",
  lastLoginAt: "",
  session: null,
  profile: {
    customerType: "personal",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
  },
};

const getCartKey = (product) => product?.id || product?.code || product?.productCode;

export const StateContext = ({ children }) => {
  const router = useRouter();
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalQuantities, setTotalQuantities] = useState(0);
  const [qty, setQty] = useState(1);
  const [indexColor, setIndexColor] = useState(1);
  const [active, setActive] = useState(false);
  const [language, setLanguage] = useState("tr");
  const [currency, setCurrency] = useState("TRY");
  const [pricingMode, setPricingMode] = useState("retail");
  const [favorites, setFavorites] = useState([]);
  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    address: "",
  });
  const [customerType, setCustomerType] = useState("personal");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [authInfo, setAuthInfo] = useState(emptyAuthInfo);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const bodyStyle = document.body.style;
    if (showCart || active) {
      bodyStyle.overflowY = "hidden";
    } else {
      bodyStyle.overflowY = "auto";
    }
  }, [showCart, active]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart) || []);
      } catch (e) {
        console.warn("Failed to parse stored cart");
      }
    }
    const savedPrefs = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        if (!router?.locale && prefs?.language) setLanguage(prefs.language);
        if (prefs?.currency) setCurrency(prefs.currency);
        if (prefs?.pricingMode) setPricingMode(prefs.pricingMode);
        if (Array.isArray(prefs?.favorites)) setFavorites(prefs.favorites);
        if (prefs?.invoiceInfo) setInvoiceInfo(prefs.invoiceInfo);
        if (prefs?.customerType) setCustomerType(prefs.customerType);
        if (prefs?.selectedCarrier) setSelectedCarrier(prefs.selectedCarrier);
        if (prefs?.selectedAddressId) setSelectedAddressId(prefs.selectedAddressId);
        if (prefs?.appliedCoupon) setAppliedCoupon(prefs.appliedCoupon);
      } catch (e) {
        console.warn("Failed to parse stored preferences");
      }
    }
    const savedAddresses = loadAddresses();
    if (savedAddresses?.length) {
      setAddresses(savedAddresses);
      const defaultAddress = savedAddresses.find((item) => item.isDefault);
      if (defaultAddress?.id) {
        setSelectedAddressId((prev) => prev || defaultAddress.id);
      }
    }
    const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuthInfo({
          ...emptyAuthInfo,
          ...parsed,
          registration: {
            ...emptyAuthInfo.registration,
            ...(parsed?.registration || {}),
          },
          login: {
            ...emptyAuthInfo.login,
            ...(parsed?.login || {}),
          },
          session: parsed?.session || null,
          profile: {
            ...emptyAuthInfo.profile,
            ...(parsed?.profile || {}),
          },
        });
        if (parsed?.profile?.customerType) {
          setCustomerType(parsed.profile.customerType);
        }
        if (parsed?.profile?.companyName || parsed?.profile?.taxNumber || parsed?.profile?.taxOffice) {
          setInvoiceInfo((prev) => ({
            ...prev,
            companyName: parsed?.profile?.companyName || prev.companyName,
            taxNumber: parsed?.profile?.taxNumber || prev.taxNumber,
            taxOffice: parsed?.profile?.taxOffice || prev.taxOffice,
          }));
        }
      } catch (e) {
        console.warn("Failed to parse stored auth info");
      }
    }
    setAuthReady(true);
  }, [router?.locale]);

  useEffect(() => {
    if (!router?.locale) return;
    setLanguage((prev) => (prev === router.locale ? prev : router.locale));
  }, [router?.locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    saveAddresses(addresses);
  }, [addresses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({
        language,
        currency,
        pricingMode,
        favorites,
        invoiceInfo,
        customerType,
        selectedCarrier,
        selectedAddressId,
        appliedCoupon,
      })
    );
  }, [
    language,
    currency,
    pricingMode,
    favorites,
    invoiceInfo,
    customerType,
    selectedCarrier,
    selectedAddressId,
    appliedCoupon,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authInfo));
  }, [authInfo]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const totalQty = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const total = calculateCartSubtotal({ cartItems, pricingMode });
    setTotalQuantities(totalQty);
    setTotalPrice(total);
  }, [cartItems, pricingMode]);

  const selectedAddress = useMemo(() => {
    if (!addresses.length) return null;
    const explicit = addresses.find((item) => item.id === selectedAddressId);
    if (explicit) return explicit;
    const fallback = addresses.find((item) => item.isDefault);
    return fallback || addresses[0];
  }, [addresses, selectedAddressId]);

  const cartTotals = useMemo(
    () =>
      buildCartTotals({
        cartItems,
        pricingMode,
        coupon: appliedCoupon,
        address: selectedAddress,
        selectedCarrier,
      }),
    [cartItems, pricingMode, appliedCoupon, selectedAddress, selectedCarrier]
  );

  useEffect(() => {
    if (!appliedCoupon) return;
    const subtotal = calculateCartSubtotal({ cartItems, pricingMode });
    const result = validateCoupon({
      code: appliedCoupon.code,
      cartItems,
      pricingMode,
      subtotal,
    });
    if (!result.valid) {
      setAppliedCoupon(null);
      setCouponError(result.reason || "invalid");
    } else if (couponError) {
      setCouponError("");
    }
  }, [appliedCoupon, cartItems, pricingMode, couponError]);

  const onAdd = (product, quantity) => {
    const productKey = getCartKey(product);
    const checkProductInCart = cartItems.find(
      (item) => getCartKey(item) === productKey
    );

    if (checkProductInCart) {
      const updatedCartItems = cartItems.map((cartProduct) => {
        if (getCartKey(cartProduct) === productKey) {
          const newQty = (cartProduct.quantity || 0) + quantity;
          return {
            ...cartProduct,
            quantity: newQty,
          };
        }
        return cartProduct;
      });

      setCartItems(updatedCartItems);
    } else {
      setCartItems([...cartItems, { ...product, quantity }]);
    }

    const variantLabel = [product.colorTone, product.sizeInfo]
      .filter(Boolean)
      .join(" / ");
    const variantText = variantLabel ? ` (${variantLabel})` : "";
    analytics.addToCart({
      items: [
        {
          id: productKey,
          name: product?.name,
          quantity,
          price: getPriceForMode(product, pricingMode),
        },
      ],
      value: getPriceForMode(product, pricingMode) * quantity,
      currency,
    });
    toast.success(
      t(language, "cart.addedToCart", {
        count: quantity,
        name: product.name || "",
        variant: variantText,
      })
    );
  };

  const onRemove = (product) => {
    const productKey = getCartKey(product);
    const newCartItems = cartItems.filter((item) => getCartKey(item) !== productKey);
    setCartItems(newCartItems);
    analytics.removeFromCart({
      items: [
        {
          id: productKey,
          name: product?.name,
          quantity: product?.quantity || 1,
          price: getPriceForMode(product, pricingMode),
        },
      ],
      value: getPriceForMode(product, pricingMode) * (product?.quantity || 1),
      currency,
    });
  };

  const toggleCartItemQuanitity = (id, value) => {
    const foundProduct = cartItems.find((item) => getCartKey(item) === id);
    const index = cartItems.findIndex((product) => getCartKey(product) === id);
    const newCartItems = cartItems.filter((item) => getCartKey(item) !== id);

    if (!foundProduct) return;

    if (value === "inc") {
      newCartItems.splice(index, 0, {
        ...foundProduct,
        quantity: (foundProduct.quantity || 0) + 1,
      });
      setCartItems(newCartItems);
    } else if (value === "dec") {
      if ((foundProduct.quantity || 0) > 1) {
        newCartItems.splice(index, 0, {
          ...foundProduct,
          quantity: (foundProduct.quantity || 0) - 1,
        });
        setCartItems(newCartItems);
      }
    }
  };

  const addAddress = (address) => {
    const id = generateAddressId();
    const timestamp = new Date().toISOString();
    const nextAddress = {
      ...address,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDefault: address?.isDefault || addresses.length === 0,
    };
    let nextAddresses = [...addresses, nextAddress];
    if (nextAddress.isDefault) {
      nextAddresses = nextAddresses.map((item) => ({
        ...item,
        isDefault: item.id === id,
      }));
    }
    setAddresses(nextAddresses);
    if (!selectedAddressId || nextAddress.isDefault) {
      setSelectedAddressId(id);
    }
    return nextAddress;
  };

  const updateAddress = (id, updates = {}) => {
    const timestamp = new Date().toISOString();
    setAddresses((prev) => {
      let next = prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: timestamp } : item
      );
      if (updates.isDefault) {
        next = next.map((item) => ({ ...item, isDefault: item.id === id }));
        setSelectedAddressId(id);
      }
      return next;
    });
  };

  const removeAddress = (id) => {
    setAddresses((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedAddressId === id) {
        const fallback = next.find((item) => item.isDefault) || next[0];
        setSelectedAddressId(fallback?.id || null);
      }
      return next;
    });
  };

  const setDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === id }))
    );
    setSelectedAddressId(id);
  };

  const applyCoupon = (code) => {
    const subtotal = calculateCartSubtotal({ cartItems, pricingMode });
    const result = validateCoupon({ code, cartItems, pricingMode, subtotal });
    if (result.valid) {
      setAppliedCoupon(result.coupon);
      setCouponError("");
      return { success: true, coupon: result.coupon };
    }
    setCouponError(result.reason || "invalid");
    return { success: false, reason: result.reason };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const incQty = () => {
    setQty((prevQty) => prevQty + 1);
  };

  const decQty = () => {
    setQty((prevQty) => {
      if (prevQty - 1 < 1) return 1;
      return prevQty - 1;
    });
  };

  const toggleFavorite = (product) => {
    const key = getCartKey(product) || product?.slug?.current;
    if (!key) return;
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const isFavorite = useMemo(() => {
    return (product) => {
      const key = getCartKey(product) || product?.slug?.current;
      return key ? favorites.includes(key) : false;
    };
  }, [favorites]);

  const isAuthenticated = Boolean(authInfo?.session?.email);

  useEffect(() => {
    if (!isAuthenticated) return;
    setAuthInfo((prev) => {
      const nextProfile = {
        ...prev.profile,
        customerType,
        companyName: invoiceInfo.companyName,
        taxNumber: invoiceInfo.taxNumber,
        taxOffice: invoiceInfo.taxOffice,
      };
      const unchanged =
        prev.profile?.customerType === nextProfile.customerType &&
        prev.profile?.companyName === nextProfile.companyName &&
        prev.profile?.taxNumber === nextProfile.taxNumber &&
        prev.profile?.taxOffice === nextProfile.taxOffice;
      if (unchanged) return prev;
      return { ...prev, profile: nextProfile };
    });
  }, [
    isAuthenticated,
    customerType,
    invoiceInfo.companyName,
    invoiceInfo.taxNumber,
    invoiceInfo.taxOffice,
  ]);

  const signIn = ({ email, password, fullName }) => {
    const timestamp = new Date().toISOString();
    setAuthInfo((prev) => ({
      ...prev,
      login: {
        email,
        password,
      },
      lastLoginAt: timestamp,
      session: {
        email,
        fullName: fullName || prev?.registration?.fullName || "",
        signedInAt: timestamp,
      },
    }));
    setAuthCookie("1");
  };

  const signOut = () => {
    setAuthInfo((prev) => ({
      ...prev,
      session: null,
    }));
    setAuthCookie("");
  };

  const changeLanguage = (nextLang) => {
    if (!nextLang || nextLang === language) return;
    setLanguage(nextLang);
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${nextLang}; path=/; max-age=31536000`;
    }
    if (router?.locale && router.locale !== nextLang) {
      router.push(router.asPath, router.asPath, { locale: nextLang, scroll: false });
    }
  };

  return (
    <Context.Provider
      value={{
        showCart,
        setShowCart,
        cartItems,
        totalPrice,
        totalQuantities,
        cartTotals,
        qty,
        active,
        setActive,
        setQty,
        incQty,
        decQty,
        onAdd,
        toggleCartItemQuanitity,
        onRemove,
        setCartItems,
        setTotalPrice,
        setTotalQuantities,
        indexColor,
        setIndexColor,
        language,
        setLanguage,
        changeLanguage,
        currency,
        setCurrency,
        pricingMode,
        setPricingMode,
        favorites,
        toggleFavorite,
        isFavorite,
        invoiceInfo,
        setInvoiceInfo,
        customerType,
        setCustomerType,
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        selectedAddress,
        selectedAddressId,
        setSelectedAddressId,
        selectedCarrier,
        setSelectedCarrier,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponError,
        authInfo,
        setAuthInfo,
        authReady,
        isAuthenticated,
        signIn,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
};
export const useStateContext = () => useContext(Context);
