'use client';

import React, { useState, useEffect } from 'react';
import { z, ZodSchema } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import FormElement from '@/components/form/form-element';
import FormWrapper from '@/components/form/form-wrapper';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';
import useFetch from '@/hooks/use-fetch';
import {
  COMPQCDataResponse,
  COMPQCDataType,
  handleResponse,
} from '@/model/types';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import LoadingPage from '@/components/loading-page';
import { LoadingModal } from '@/components/modal/loading-modal';
import { FormMessage } from '@/components/ui/form';

// 기본 스키마 정의
const CompQCSchemaBase = z.object({
  MILEAGE: z.string().refine((val) => !isNaN(Number(val)), {
    message: '주행 거리는 0 이상의 정수만 입력할 수 있습니다.',
  }),
  ENTRYLOCATION: z.string().nonempty('차량 입고 위치를 선택해 주세요.'),
  DETAILLOCATION: z.string().optional(),
  KEYLOCATION: z.string().nonempty('차 키의 보관 위치를 입력해 주세요.'),
  IMGLIST: z.any(),
});

// 신차에 대한 추가 스키마 정의
const CompQCSchemaNew = CompQCSchemaBase.extend({
  KEYQUANT: z.string().refine((val) => !isNaN(Number(val)), {
    message: '키 개수는 0 이상의 정수만 입력할 수 있습니다.',
  }),
  KEYTOTAL: z.string().refine((val) => !isNaN(Number(val)), {
    message: '총 키 개수는 0 이상의 정수만 입력할 수 있습니다.',
  }),
});

type CompQCSchemaType = z.infer<typeof CompQCSchemaBase> &
  Partial<z.infer<typeof CompQCSchemaNew>>;

const CompQCDetail: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [schema, setSchema] = useState<ZodSchema>(CompQCSchemaBase);

  const {
    data: fetchedData,
    loading,
    error,
    revalidate,
  } = useFetch<COMPQCDataResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/CompQC/D`
  );

  // GUBUN 값에 따라 스키마를 동적으로 변경
  useEffect(() => {
    if (fetchedData) {
      const apiData: COMPQCDataType[] = [];
      handleResponse(fetchedData, apiData);
      const selectedData = apiData.find(
        (data) => data.ASSETNO === params.ASSETNO
      );
      if (selectedData && selectedData.GUBUN === '신차') {
        setSchema(CompQCSchemaNew);
      } else {
        setSchema(CompQCSchemaBase);
      }
    }
  }, [fetchedData, params.ASSETNO]);

  const compQCForm = useForm<CompQCSchemaType>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  if (loading) return <LoadingPage />;
  if (error) return <p className="px-4">Error: {error.message}</p>;
  if (!fetchedData) return <p className="px-4">No data</p>;

  const entryLocationList = fetchedData.reqCode[0].HR58;
  const apiData: COMPQCDataType[] = [];

  handleResponse(fetchedData, apiData);

  const selectedData = apiData.find((data) => data.ASSETNO === params.ASSETNO);

  if (!selectedData || !entryLocationList) {
    return <p className="px-4">해당 데이터가 없습니다.</p>;
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const onCompQCFormSubmit = async (data: CompQCSchemaType) => {
    const formData = new FormData();

    // formData.append('CHADAENO', selectedData.CHADAENO);

    formData.append('MILEAGE', data.MILEAGE);
    formData.append('ENTRYLOCATION', data.ENTRYLOCATION);
    formData.append('DETAILLOCATION', data.DETAILLOCATION || '');
    formData.append('KEYQUANT', data.KEYQUANT || '');
    formData.append('KEYTOTAL', data.KEYTOTAL || '');
    formData.append('KEYLOCATION', data.KEYLOCATION);

    selectedFiles.forEach((image) => {
      formData.append('IMGLIST', image);
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/CompQC/${params.ASSETNO}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      showSuccessToast('완료되었습니다.');

      revalidate();
      router.replace('/compqc');
    } catch (error) {
      showErrorToast('요청에 실패하였습니다.');
    }
  };

  return (
    <div className="px-4 flex justify-center items-center">
      <Card className="w-full rounded-xl border-slate-200 border-2 mb-24">
        <CardHeader>
          <CardTitle>상품화 완료 QC 상세 조회</CardTitle>
          <CardDescription>
            <span className="ml-0.5 text-[#F31515] text-sm font-medium">*</span>
            {' 표시된 곳은 반드시 입력해 주셔야 합니다.'}
          </CardDescription>
        </CardHeader>
        <FormWrapper form={compQCForm} onSubmit={onCompQCFormSubmit}>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between h-10">
                <Label className="font-semibold">차량 번호</Label>
                <p>{selectedData.CARNO}</p>
              </div>
              <div className="flex items-center justify-between h-10">
                <Label className="font-semibold">차대 번호</Label>
                <p>{selectedData.CHADAENO}</p>
              </div>
              <div className="flex items-center justify-between h-10">
                <Label className="font-semibold">모델명</Label>
                <p>{selectedData.MODEL}</p>
              </div>
            </div>
            <div className="w-full flex flex-col gap-4 mt-6">
              <FormElement
                formControl={compQCForm.control}
                name="MILEAGE"
                label="주행 거리 (km)"
                required
                description="숫자만 입력해주세요. ex) 31704"
              >
                <Input
                  placeholder="주행거리를 입력해주세요."
                  className="h-10"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  defaultValue={selectedData.MILEAGE}
                />
              </FormElement>
              <FormElement
                formControl={compQCForm.control}
                name="ENTRYLOCATION"
                label="차량 입고 위치"
                required
              >
                <Controller
                  name="ENTRYLOCATION"
                  control={compQCForm.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="차량 입고 위치를 선택해 주세요." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {entryLocationList.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldState.error && <FormMessage />}
                    </>
                  )}
                />
              </FormElement>
              <FormElement
                formControl={compQCForm.control}
                name="DETAILLOCATION"
                label="차량 상세 위치"
              >
                <Input placeholder="" className="h-10" />
              </FormElement>
              {selectedData.GUBUN === '신차' && (
                <div className="w-full flex gap-4">
                  <FormElement
                    formControl={compQCForm.control}
                    name="KEYQUANT"
                    label="차 키 보유 수량"
                    required
                    description="숫자만 입력해주세요."
                  >
                    <Input
                      placeholder="보유 수량"
                      className="h-10"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      defaultValue={selectedData.KEYQUANT}
                    />
                  </FormElement>
                  <FormElement
                    formControl={compQCForm.control}
                    name="KEYTOTAL"
                    label="총 수량"
                    required
                    description="숫자만 입력해주세요."
                  >
                    <Input
                      placeholder="총 수량"
                      className="h-10"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      defaultValue={selectedData.KEYTOTAL}
                    />
                  </FormElement>
                </div>
              )}
              <FormElement
                formControl={compQCForm.control}
                name="KEYLOCATION"
                label="차 키 보관 위치"
                required
              >
                <Input
                  placeholder="차 키의 보관 위치"
                  className="h-10"
                  defaultValue={selectedData.KEYLOCATION}
                />
              </FormElement>
              <FormElement
                formControl={compQCForm.control}
                name="IMGLIST"
                label="차량 사진"
                onChange={onFileChange}
              >
                <Input type="file" multiple />
              </FormElement>
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <Label className="font-semibold">업로드된 이미지:</Label>
                  <ul className="list-disc list-inside">
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="fixed bottom-0 left-0 w-full p-4 z-10 bg-white">
            <Button
              className="w-full h-12 rounded-lg"
              type="submit"
              disabled={
                !compQCForm.formState.isValid ||
                compQCForm.formState.isSubmitting
              }
            >
              상품화 완료 (QC)
            </Button>
          </CardFooter>
        </FormWrapper>
      </Card>
      <LoadingModal open={compQCForm.formState.isSubmitting} />
    </div>
  );
};

export default CompQCDetail;
