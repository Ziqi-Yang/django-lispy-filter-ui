import { expect, test } from "vitest";
import { genFieldsListFromSchema, getFieldType } from "./schema";
import type { Schema } from "./types";

const SchemaOnlyModels = {
  models: {
    fieldsmodel: {
      __rel: ["user"],
      __verbose_name: "字段模型",
      id: {
        verbose_name: "ID",
        class: "BigAutoField",
        choices: null,
      },
      char: {
        verbose_name: "字符",
        class: "CharField",
        choices: null,
      },
      integer: {
        verbose_name: "整数",
        class: "IntegerField",
        choices: null,
      },
      datetime: {
        verbose_name: "日期",
        class: "DateTimeField",
        choices: null,
      },
      choice0: {
        verbose_name: "审核状态",
        class: "CharField",
        choices: {
          "": "---------",
          pending: "审核中",
          rejected: "审核不通过",
          approved: "审核通过",
        },
      },
    },
    user: {
      __rel: ["logentry", "fieldsmodel", "groups", "user_permissions"],
      __verbose_name: "user",
      id: {
        verbose_name: "ID",
        class: "AutoField",
        choices: null,
      },
      password: {
        verbose_name: "password",
        class: "CharField",
        choices: null,
      },
      last_login: {
        verbose_name: "last login",
        class: "DateTimeField",
        choices: null,
      },
      is_superuser: {
        verbose_name: "superuser status",
        class: "BooleanField",
        choices: null,
      },
      username: {
        verbose_name: "username",
        class: "CharField",
        choices: null,
      },
      first_name: {
        verbose_name: "first name",
        class: "CharField",
        choices: null,
      },
      last_name: {
        verbose_name: "last name",
        class: "CharField",
        choices: null,
      },
      email: {
        verbose_name: "email address",
        class: "EmailField",
        choices: null,
      },
      is_staff: {
        verbose_name: "staff status",
        class: "BooleanField",
        choices: null,
      },
      is_active: {
        verbose_name: "active",
        class: "BooleanField",
        choices: null,
      },
      date_joined: {
        verbose_name: "date joined",
        class: "DateTimeField",
        choices: null,
      },
    },
  },
  lookups: {},
};

test("genFieldsListFromSchema", () => {
  const res = genFieldsListFromSchema("fieldsmodel", SchemaOnlyModels.models);
  expect(res).toEqual([
    {
      children: [
        {
          label: "ID",
          value: "id",
        },
        {
          label: "password",
          value: "password",
        },
        {
          label: "last login",
          value: "last_login",
        },
        {
          label: "superuser status",
          value: "is_superuser",
        },
        {
          label: "username",
          value: "username",
        },
        {
          label: "first name",
          value: "first_name",
        },
        {
          label: "last name",
          value: "last_name",
        },
        {
          label: "email address",
          value: "email",
        },
        {
          label: "staff status",
          value: "is_staff",
        },
        {
          label: "active",
          value: "is_active",
        },
        {
          label: "date joined",
          value: "date_joined",
        },
      ],
      label: "user",
      value: "user",
    },
    {
      label: "ID",
      value: "id",
    },
    {
      label: "字符",
      value: "char",
    },
    {
      label: "整数",
      value: "integer",
    },
    {
      label: "日期",
      value: "datetime",
    },
    {
      label: "审核状态",
      value: "choice0",
    },
  ]);
});


test("getFieldType", () => {
  let res = getFieldType(["id"], "fieldsmodel", SchemaOnlyModels.models);
  expect(res).toEqual("BigAutoField");

  res = getFieldType(["user", "last_login"], "fieldsmodel", SchemaOnlyModels.models);
  expect(res).toEqual("DateTimeField");
})
