"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Users, DollarSign, Copy, Share2, Plus, Minus, RefreshCw } from 'lucide-react';

interface Person {
  id: number;
  name: string;
  currency: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface ResultPerson {
  name: string;
  currency: string;
  amount: number;
  symbol: string;
}

interface SplitResult {
  totalAmount: number;
  baseCurrency: string;
  amountPerPerson: number;
  people: ResultPerson[];
}

const SplitPay: React.FC = () => {
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [people, setPeople] = useState<Person[]>([
    { id: 1, name: '', currency: 'NGN' },
    { id: 2, name: '', currency: 'USD' },
    { id: 3, name: '', currency: 'GBP' }
  ]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SplitResult | null>(null);
  const [error, setError] = useState<string>('');

  const nameRefs = useRef<HTMLInputElement[]>([]);
  const currencyRefs = useRef<HTMLSelectElement[]>([]);

  const getCurrencySymbolFallback = (code: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      ZAR: 'R'
    };
    return symbols[code] || code;
  };

  const getCurrencySymbol = (code: string): string => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : getCurrencySymbolFallback(code);
  };

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError('');

    try {
      // Mock exchange rates for demo purposes
      const mockRates = {
        USD: 1,
        NGN: 1640,
        GBP: 0.79,
        EUR: 0.92,
        CAD: 1.37,
        AUD: 1.53,
        JPY: 149,
        CNY: 7.24,
        INR: 83.12,
        ZAR: 18.65
      };
      
      setExchangeRates(mockRates);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to fetch currencies:", err.message);
      } else {
        console.error("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        // Mock currency data for demo
        const mockCurrencies: Currency[] = [
          { code: 'USD', name: 'US Dollar', symbol: '$' },
          { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
          { code: 'GBP', name: 'British Pound', symbol: '£' },
          { code: 'EUR', name: 'Euro', symbol: '€' },
          { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
          { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
          { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
          { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
          { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
          { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
        ];
        setCurrencies(mockCurrencies);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Failed to fetch currencies:", err.message);
        } else {
          console.error("An unknown error occurred.");
        }
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    fetchExchangeRates();
  }, [baseCurrency]);

  const addPerson = () => {
    const newId = Math.max(...people.map(p => p.id)) + 1;
    setPeople([...people, { id: newId, name: '', currency: 'USD' }]);
  };

  const removePerson = (id: number) => {
    if (people.length > 1) {
      setPeople(people.filter(p => p.id !== id));
    }
  };

  const updatePerson = (id: number, field: keyof Person, value: string) => {
    setPeople(people.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const calculateSplit = () => {
    const amount = parseFloat(totalAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid total amount');
      return;
    }

    if (people.some(p => !p.name.trim())) {
      setError('Please enter names for all people');
      return;
    }

    const amountPerPerson = amount / people.length;
    const splitResults: ResultPerson[] = people.map(person => {
      let convertedAmount = amountPerPerson;

      if (person.currency !== baseCurrency) {
        const rate = exchangeRates[person.currency];
        if (rate) {
          convertedAmount = amountPerPerson * rate;
        }
      }

      return {
        name: person.name,
        currency: person.currency,
        amount: convertedAmount,
        symbol: getCurrencySymbol(person.currency)
      };
    });

    setResults({
      totalAmount: amount,
      baseCurrency,
      amountPerPerson,
      people: splitResults
    });
    setError('');
  };

  const copyResults = () => {
    if (!results) return;

    const text = `Bill Split Results:\nTotal: ${getCurrencySymbol(baseCurrency)}${results.totalAmount}\nSplit ${results.people.length} ways:\n\n${results.people.map(p => `${p.name}: ${p.symbol}${p.amount.toFixed(2)}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  const shareResults = () => {
    if (!results) return;

    const text = `Bill Split Results:\nTotal: ${getCurrencySymbol(baseCurrency)}${results.totalAmount}\nSplit ${results.people.length} ways:\n\n${results.people.map(p => `${p.name}: ${p.symbol}${p.amount.toFixed(2)}`).join('\n')}`;

    if (navigator.share) {
      navigator.share({ title: 'Bill Split Results', text });
    } else {
      copyResults();
    }
  };

  const handleTotalAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      nameRefs.current[0]?.focus();
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      currencyRefs.current[index]?.focus();
    }
  };

  const handleCurrencyKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>, index: number) => {
    if (e.key === 'Enter') {
      if (index + 1 < people.length) {
        nameRefs.current[index + 1]?.focus();
      } else {
        calculateSplit();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-20 lg:p-6">
      <div className="max-w-sm md:max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">SplitPay</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Split bills fairly across different currencies</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Bill Details Panel */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              Bill Details
            </h2>

            {/* Total Amount Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Total Amount</label>
              <div className="flex flex-row lg:flex-col gap-3">
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full lg:w-auto lg:min-w-[200px] px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  onKeyDown={handleTotalAmountKeyDown}
                  placeholder="Enter total amount"
                  className="w-full lg:flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* People Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  People ({people.length})
                </label>
                <button
                  onClick={addPerson}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition-colors"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Add Person</span>
                  <span className="xs:hidden">Add</span>
                </button>
              </div>

              <div className="space-y-3">
                {people.map((person, index) => (
                  <div key={person.id} className="flex gap-2 lg:gap-3 p-3 bg-gray-50 rounded-lg">
                    {/* Name Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        ref={(el) => {
                          if (el) nameRefs.current[index] = el;
                        }}
                        value={person.name}
                        onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                        onKeyDown={(e) => handleNameKeyDown(e, index)}
                        placeholder={`Person ${index + 1} name`}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    {/* Currency and Remove Button Row */}
                    <div className="flex gap-2">
                      <select
                        ref={(el) => {
                          if (el) currencyRefs.current[index] = el;
                        }}
                        value={person.currency}
                        onChange={(e) => updatePerson(person.id, 'currency', e.target.value)}
                        onKeyDown={(e) => handleCurrencyKeyDown(e, index)}
                        className="flex-1 lg:w-24 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code}
                          </option>
                        ))}
                      </select>
                      {people.length > 1 && (
                        <button
                          onClick={() => removePerson(person.id)}
                          className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                          aria-label={`Remove ${person.name || `Person ${index + 1}`}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exchange Rate Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Exchange rates: {loading ? 'Loading...' : 'Ready'}</span>
                </div>
                <button
                  onClick={fetchExchangeRates}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-800 underline text-xs sm:text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={calculateSplit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base transition-colors"
            >
              Calculate Split
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Split Results
            </h2>

            {results ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Total Summary */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg border border-gray-100">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Bill</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                    {getCurrencySymbol(results.baseCurrency)}{results.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Split {results.people.length} ways = {getCurrencySymbol(results.baseCurrency)}{results.amountPerPerson.toFixed(2)} each
                  </div>
                </div>

                {/* Individual Results */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Amount per person:</h3>
                  {results.people.map((person, index) => (
                    <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex flex-row lg:flex-col lg:items-center gap-1 lg:gap-2">
                        <span className="font-medium text-gray-800 text-sm lg:text-base">{person.name}</span>
                        <span className="text-xs text-gray-500">({person.currency})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg lg:text-xl font-bold text-indigo-600">
                          {person.symbol}{person.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-3">
                  <button
                    onClick={copyResults}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm lg:text-base"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Results
                  </button>
                  <button
                    onClick={shareResults}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm lg:text-base"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Results
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 sm:py-12">
                <Calculator className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base px-4">Enter bill details and click {'"Calculate Split"'} to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPay;