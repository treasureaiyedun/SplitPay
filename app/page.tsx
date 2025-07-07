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

const CurrencySplit: React.FC = () => {
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

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_API_KEY}/codes`);
      const data = await response.json();

      if (data.result === "success" && Array.isArray(data.supported_codes)) {
        const mappedCurrencies: Currency[] = data.supported_codes.map(([code, name]: [string, string]) => ({
          code,
          name,
          symbol: getCurrencySymbolFallback(code)
        }));
        setCurrencies(mappedCurrencies);
      } else {
        throw new Error('Invalid currency data');
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_API_KEY}/latest/${baseCurrency}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setExchangeRates(data.conversion_rates);
    } catch (err) {
      setError('Failed to fetch exchange rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">SplitPay</h1>
          </div>
          <p className="text-gray-600">Split bills fairly across different currencies</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Bill Details
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
              <div className="flex gap-2">
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="max-w-[15rem] py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                <input
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  onKeyDown={handleTotalAmountKeyDown}
                  placeholder="Enter total amount"
                  className="max-w-max py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 px-2"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">People ({people.length})</label>
                <button
                  onClick={addPerson}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm mb-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Person
                </button>
              </div>

              {people.map((person, index) => (
                <div key={person.id} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    ref={(el) => {
                      if (el) nameRefs.current[index] = el;
                    }}
                    value={person.name}
                    onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                    onKeyDown={(e) => handleNameKeyDown(e, index)}
                    placeholder={`Person ${index + 1} name`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    ref={(el) => {
                      if (el) currencyRefs.current[index] = el;
                    }}
                    value={person.currency}
                    onChange={(e) => updatePerson(person.id, 'currency', e.target.value)}
                    onKeyDown={(e) => handleCurrencyKeyDown(e, index)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Exchange rates: {loading ? 'Loading...' : 'Ready'}</span>
                <button
                  onClick={fetchExchangeRates}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-800 underline"
                >
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={calculateSplit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Calculate Split
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Split Results
            </h2>

            {results ? (
              <div>
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">Total Bill</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {getCurrencySymbol(results.baseCurrency)}{results.totalAmount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Split {results.people.length} ways = {getCurrencySymbol(results.baseCurrency)}{results.amountPerPerson.toFixed(2)} each
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {results.people.map((person, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-indigo-50 rounded-md">
                      <div className="font-medium text-gray-800">{person.name}</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {person.symbol}{person.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyResults}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={shareResults}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter bill details and click "Calculate Split" to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySplit;
