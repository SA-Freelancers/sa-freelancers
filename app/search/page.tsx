"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import EmptyState from "../components/EmptyState";

type Review = {
  rating?: number;
};

type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  bio?: string;
  category?: string;
  verified?: boolean;
  top_rated?: boolean;
  reviews?: Review[];
};

type Job = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  budget?: number |