'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import useFetch from '@/hooks/use-fetch';
import LoadingPage from '@/components/loading-page';
import {
  INQCOLDDataResponse,
  INQCOLDDataType,
  handleResponse,
} from '@/model/types';

const INQCOLD: React.FC = () => {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedASSETNO, setSelectedASSETNO] = useState<string>('');

  const {
    data: fetchedData,
    loading,
    error,
  } = useFetch<INQCOLDDataResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/INQCOLD`
  );

  if (loading) return <LoadingPage />;
  if (error) return <p className="px-4">Error: {error.message}</p>;
  if (!fetchedData) return <p className="px-4">No data</p>;

  console.log(fetchedData);

  const apiData: INQCOLDDataType[] = [];

  handleResponse(fetchedData, apiData);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const assetno = e.currentTarget.getAttribute('data-assetno');
    const data = apiData.find((data) => data.ASSETNO === assetno);
    if (data) {
      selectedASSETNO === data.ASSETNO
        ? router.push(`/INQCOLD/${data.ASSETNO}`)
        : setSelectedASSETNO(data.ASSETNO);
    }
  };

  const handleDetailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (selectedASSETNO) {
      router.push(`/INQCOLD/${selectedASSETNO}`);
    }
  };

  const filteredData = apiData.filter((datum) => {
    return datum.CARNO.includes(search);
  });

  console.log(filteredData);

  return (
    <article className="px-4 relative">
      <h1 className="text-center font-medium text-xl my-8 text-[#1B1B1B]/90">
        재렌트 입고 QC
      </h1>
      <div className="flex flex-col my-4 gap-4">
        <Input
          placeholder="차량번호로 검색하기"
          name="search"
          value={search}
          onChange={handleSearch}
        />
      </div>
      <Table className="mb-24">
        <TableHeader>
          <TableRow className="bg-green-500/50 hover:bg-green-500/35">
            <TableHead className="text-center rounded-tl-lg px-1">
              차량번호
            </TableHead>
            <TableHead className="text-center px-1">고객명</TableHead>
            <TableHead className="text-center rounded-tr-lg px-1">
              입고사유
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((data) => (
            <TableRow
              key={data.ASSETNO}
              data-assetno={data.ASSETNO}
              onClick={handleRowClick}
              className={
                data.ASSETNO === selectedASSETNO ? 'text-primary/80' : ''
              }
            >
              <TableCell className="font-medium text-center px-1">
                {data.CARNO}
              </TableCell>
              <TableCell className="text-center px-1">{data.CNAME}</TableCell>
              <TableCell className="text-center px-1">{data.INRSON}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex fixed bottom-0 left-0 w-full p-4 bg-white z-10">
        <Button
          className="w-full h-12 rounded-lg"
          onClick={handleDetailClick}
          disabled={!selectedASSETNO}
        >
          입력
        </Button>
      </div>
    </article>
  );
};

export default INQCOLD;
